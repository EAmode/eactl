# eactl
EA Mode management CLI. Managing infrastructure and applications

```shell
eactl 
ssh prod-admin@wbg.eamode.com -i env/wbg/prod/prod-admin.private
```

## ssh shell access 
```shell
ssh prod-admin@eamode.com -i env/mode/prod-admin.private
ssh prod-admin@wbg.eamode.com -i env/wbg/prod/prod-admin.private
```

## Certificates
```shell
sudo certbot certonly --manual --preferred-challenges dns --server https://acme-v02.api.letsencrypt.org/directory -d '*.eamode.com'
```
