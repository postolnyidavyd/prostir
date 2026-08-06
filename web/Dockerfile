# збірка
FROM node:24-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# VITE_API_URL інлайниться у бандл на етапі збірки (Vite читає process.env.VITE_*)
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

# рантайм: статика через nginx
FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
