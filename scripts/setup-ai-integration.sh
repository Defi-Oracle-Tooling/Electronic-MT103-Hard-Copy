#!/bin/bash
# Set up AI integration capabilities for MT103 system

set -e  # Exit immediately if a command exits with non-zero status

echo "🧠 Setting up GitHub Copilot AI integration for MT103 system..."

# Check for required environment variables
if [ -z "$GITHUB_COPILOT_API_KEY" ]; then
    echo "⚠️ GITHUB_COPILOT_API_KEY environment variable not found."
    echo "Please set it before continuing with:"
    echo "export GITHUB_COPILOT_API_KEY=your-api-key"
    exit 1
fi

# Create required directories
mkdir -p ./src/ai
mkdir -p ./config/ai
mkdir -p ./tests/ai

# Generate AI configuration file
cat > ./config/ai/config.json << EOF
{
  "model": "github-copilot",
  "apiEndpoint": "https://api.githubcopilot.com/v1",
  "features": {
    "messageCompletion": true,
    "complianceValidation": true,
    "anomalyDetection": true,
    "documentGeneration": true
  },
  "security": {
    "encryptPayloads": true,
    "auditRequests": true,
    "maxTokens": 4096,
    "allowedDomains": ["mt103-system.example.com"]
  }
}
EOF

# Install required dependencies
echo "📦 Installing AI integration dependencies..."
pnpm add @azure/openai langchain @github/copilot-node

# Create basic test to verify AI capabilities
cat > ./tests/ai/copilot-integration.test.js << EOF
const { CopilotService } = require('../../src/ai/copilot-service');

describe('GitHub Copilot Integration', () => {
  let copilotService;
  
  beforeEach(() => {
    copilotService = new CopilotService();
  });
  
  test('should enhance partial MT103 message', async () => {
    const partialMessage = {
      senderBIC: 'BANKFRPPXXX',
      currency: 'USD',
      valueDate: '2024-05-10'
    };
    
    const instructions = 'Complete this transaction for $75,000 to GlobalTech Inc';
    
    const result = await copilotService.enhanceMessage(partialMessage, instructions);
    
    expect(result).toHaveProperty('messageId');
    expect(result).toHaveProperty('amount', 75000);
    expect(result).toHaveProperty('beneficiaryName', 'GlobalTech Inc');
    expect(result).toHaveProperty('senderBIC', 'BANKFRPPXXX');
  });
  
  test('should validate compliance with regulations', async () => {
    const message = {
      senderBIC: 'BANKFRPPXXX',
      receiverBIC: 'BOFAUS3NXXX',
      amount: 50000,
      currency: 'USD',
      beneficiaryName: 'ACME Corporation'
    };
    
    const result = await copilotService.validateCompliance(message);
    
    expect(result.isCompliant).toBeDefined();
    expect(result.regulations).toContain('AML');
    expect(result.regulations).toContain('FATF');
  });
});
EOF

# Create base service class for Copilot integration
cat > ./src/ai/copilot-service.js << EOF
const { Configuration, OpenAIApi } = require('@azure/openai');
const config = require('../../config/ai/config.json');

class CopilotService {
  constructor() {
    this.configuration = new Configuration({
      apiKey: process.env.GITHUB_COPILOT_API_KEY,
      basePath: config.apiEndpoint
    });
    this.openai = new OpenAIApi(this.configuration);
    this.model = config.model;
  }
  
  async enhanceMessage(partialMessage, instructions) {
    try {
      const prompt = this.constructMessagePrompt(partialMessage, instructions);
      
      const response = await this.openai.createCompletion({
        model: this.model,
        prompt,
        max_tokens: config.security.maxTokens,
        temperature: 0.1 // Low temperature for more predictable results
      });
      
      const enhancedMessage = this.parseMessageResponse(response.data);
      return {
        ...partialMessage,
        ...enhancedMessage
      };
    } catch (error) {
      console.error('Error enhancing message:', error);
      throw new Error('Failed to enhance message with AI');
    }
  }
  
  async validateCompliance(message) {
    try {
      const prompt = this.constructCompliancePrompt(message);
      
      const response = await this.openai.createCompletion({
        model: this.model,
        prompt,
        max_tokens: 1000,
        temperature: 0
      });
      
      return this.parseComplianceResponse(response.data);
    } catch (error) {
      console.error('Error validating compliance:', error);
      throw new Error('Failed to validate compliance with AI');
    }
  }
  
  constructMessagePrompt(partialMessage, instructions) {
    return \`
You are an expert SWIFT MT103 message formatter. 
Complete the following partial MT103 message according to these instructions:
${instructions}

Partial message:
${JSON.stringify(partialMessage, null, 2)}

Provide a complete MT103 message in JSON format, filling in all required fields according to SWIFT standards.
\`;
  }
  
  constructCompliancePrompt(message) {
    return \`
You are a financial compliance expert.
Analyze this MT103 message for compliance with international banking regulations:
${JSON.stringify(message, null, 2)}

Check for compliance with:
1. Anti-Money Laundering (AML) regulations
2. Counter-Terrorist Financing (CTF) 
3. FATF recommendations
4. Sanctions screening

Provide a JSON response with:
- isCompliant: boolean
- regulations: string[] (list of relevant regulations checked)
- issues: string[] (list of potential issues found, or empty if compliant)
- riskScore: number (0-1 scale)
\`;
  }
  
  parseMessageResponse(response) {
    try {
      const content = response.choices[0].text.trim();
      return JSON.parse(content);
    } catch (error) {
      throw new Error('Failed to parse AI response');
    }
  }
  
  parseComplianceResponse(response) {
    try {
      const content = response.choices[0].text.trim();
      return JSON.parse(content);
    } catch (error) {
      throw new Error('Failed to parse compliance response');
    }
  }
}

module.exports = { CopilotService };
EOF

# Create API endpoint for AI integration
mkdir -p ./src/api/routes
cat > ./src/api/routes/ai-routes.js << EOF
const express = require('express');
const { CopilotService } = require('../../ai/copilot-service');
const { authenticateJWT, validateRequest } = require('../middleware');

const router = express.Router();
const copilotService = new CopilotService();

/**
 * @route POST /api/v1/mt103/ai/enhance
 * @desc Enhance a partial MT103 message using AI
 * @access Private
 */
router.post('/enhance', 
    authenticateJWT, 
    validateRequest,
    async (req, res) => {
        try {
            const { partialMessage, instructions } = req.body;
            
            if (!partialMessage || !instructions) {
                return res.status(400).json({ 
                    error: 'Missing required parameters', 
                    message: 'Both partialMessage and instructions are required' 
                });
            }
            
            const enhancedMessage = await copilotService.enhanceMessage(partialMessage, instructions);
            res.json(enhancedMessage);
        } catch (error) {
            console.error('AI enhancement error:', error);
            res.status(500).json({ error: 'AI enhancement failed', message: error.message });
        }
    }
);

/**
 * @route POST /api/v1/mt103/ai/validate-compliance
 * @desc Validate MT103 compliance using AI
 * @access Private
 */
router.post('/validate-compliance', 
    authenticateJWT,
    validateRequest,
    async (req, res) => {
        try {
            const message = req.body;
            
            const complianceResult = await copilotService.validateCompliance(message);
            res.json(complianceResult);
        } catch (error) {
            console.error('AI compliance validation error:', error);
            res.status(500).json({ error: 'Compliance validation failed', message: error.message });
        }
    }
);

module.exports = router;
EOF

echo "✅ GitHub Copilot AI integration setup complete!"
echo "To use the AI capabilities, make sure to:"
echo "1. Set the GITHUB_COPILOT_API_KEY environment variable"
echo "2. Mount the AI routes in your application"
echo "3. Run tests to verify functionality: pnpm test tests/ai/"
