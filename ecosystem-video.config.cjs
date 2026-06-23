{
  "apps": [
    {
      "name": "qizi-video",
      "script": "server/index.js",
      "cwd": "/var/www/qizi-video",
      "instances": 1,
      "autorestart": true,
      "watch": false,
      "max_memory_restart": "512M",
      "env": {
        "NODE_ENV": "production",
        "PORT": 3001
      }
    }
  ]
}
