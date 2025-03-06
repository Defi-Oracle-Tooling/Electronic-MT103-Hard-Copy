FROM node:16-alpine

WORKDIR /app

# Install Python and dependencies
RUN apk add --no-cache python3 py3-pip

# Copy package files
COPY package*.json ./
COPY requirements.txt ./

# Install dependencies
RUN npm install
RUN pip3 install -r requirements.txt

# Copy source code
COPY . .

# Expose port
EXPOSE 3000

CMD ["npm", "start"]
