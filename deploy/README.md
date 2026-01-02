# JPEG Encoder Deployment

## Quick Deploy

```bash
unzip jpeg-encoder-deploy.zip
cd jpeg-encoder-deploy
docker-compose up -d --build
```

The app will be available on port 3000 (internal). 
Configure Caddy to proxy to `jpeg-encoder:3000`.

## Caddy Configuration

Add to your Caddyfile:

```
sem1-cercetare.danielwagner.ro {
    reverse_proxy jpeg-encoder:3000
}
```

Then reload Caddy:
```bash
docker exec dsp-caddy caddy reload --config /etc/caddy/Caddyfile
```
