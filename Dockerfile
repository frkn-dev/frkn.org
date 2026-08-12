FROM nginx:1.31.3-alpine-slim

RUN rm /etc/nginx/conf.d/default.conf && \
    cat > /etc/nginx/conf.d/default.conf <<'EOF'
server {
    listen 80;
    server_name _;

    root /usr/share/nginx/html;
    index index.html;
    charset utf-8;

    error_page 404 /404.html;

    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types
        text/plain
        text/css
        text/xml
        application/json
        application/javascript
        application/xml
        application/xml+rss
        image/svg+xml;

    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    location = /health {
        access_log off;
        default_type text/plain;
        return 200 "ok\n";
    }

    location = /install {
        default_type text/plain;
        try_files /install =404;
    }

    location ~ /\.(?!well-known) {
        deny all;
    }

    location ~* \.(?:css|js|mjs|json|xml|txt|svg|ico|png|jpg|jpeg|gif|webp|woff2?)$ {
        expires 7d;
        add_header Cache-Control "public";
        try_files $uri =404;
    }

    location / {
        try_files $uri $uri/ =404;
    }
}
EOF

COPY . /usr/share/nginx/html/

RUN rm -rf \
    /usr/share/nginx/html/.git \
    /usr/share/nginx/html/.github \
    /usr/share/nginx/html/.kimi-code \
    /usr/share/nginx/html/.DS_Store

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget -qO- http://127.0.0.1/health || exit 1

CMD ["nginx", "-g", "daemon off;"]
