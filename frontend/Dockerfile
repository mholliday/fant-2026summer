FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
# Pass build-time API URL if needed for a non-proxied production build
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

# Serve the built app with nginx
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
# Handle client-side routing: all unmatched paths → index.html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
