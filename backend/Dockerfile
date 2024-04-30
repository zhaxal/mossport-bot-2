# Use an official Node.js runtime as the base image
FROM --platform=linux/amd64 node:16-alpine as build

# Set the working directory in the Docker container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Install the project dependencies
RUN npm ci

# Copy the rest of the project files to the working directory
COPY . .

# Build the project
RUN npm run build

# Start a new stage from scratch
FROM --platform=linux/amd64 node:16-alpine

WORKDIR /usr/src/app

# Copy only the dependencies installation from the 1st stage
COPY --from=build /usr/src/app/node_modules ./node_modules
COPY --from=build /usr/src/app/dist ./dist
COPY package*.json ./

# Define the command to run the app
CMD [ "npm", "start" ]