# build stage (Node 24 LTS 로 고정 — lts 태그가 바뀌어도 빌드가 달라지지 않게)
FROM node:24-alpine AS build-stage
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# production stage
FROM nginx:stable-alpine AS production-stage
# nginx 설정은 템플릿: 컨테이너 시작 때 공식 이미지가 ${PRERENDER_UPSTREAM} 를 채워 /etc/nginx/conf.d/default.conf 를 만든다.
COPY ./nginx.default.conf /etc/nginx/templates/default.conf.template
# 크롤러용 서버 렌더 HTML·사이트맵·RSS 를 가져올 API 서버 (같은 호스트에서 돌면 docker run -e PRERENDER_UPSTREAM=http://127.0.0.1:8080 으로 바꿀 수 있다)
ENV PRERENDER_UPSTREAM=https://api.hwanstory.kr
COPY ./robots.txt /usr/share/nginx/html/robots.txt
COPY --from=build-stage /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
