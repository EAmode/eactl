# eactl
EA Mode management CLI. Managing infrastructure and applications

## Eaxamples
```sh
eactl create website ea.eamode.cloud dist/mode-ui-exp/ -e mode
eactl update website ea.eamode.cloud dist/mode-ui-exp/ -e mode

```


## ssh shell access 
```shell
ssh prod-admin@eamode.com -i env/mode/prod-admin.private
ssh prod-admin@wbg.eamode.com -i env/wbg/prod/prod-admin.private
```

## Certificates
Subdomain HTTP validation
```shell
sudo certbot --nginx -d example.com -d stage.example.com -d www.example.com
```
Wildcard DNS validation

```shell
# create
sudo certbot certonly -d '*.eamode.com' -d 'eamode.com' --manual --preferred-challenges dns --keep-until-expiring --quiet --manual-public-ip-logging-ok --manual-auth-hook /root/authenticator_godaddy.sh  --manual-cleanup-hook /root/cleanup_godaddy.sh 

#crontab entries
0 5 * * * certbot certonly -d '*.eamode.com' -d 'eamode.com' --manual --preferred-challenges dns --keep-until-expiring --quiet --manual-public-ip-logging-ok --manual-auth-hook /root/authenticator_godaddy.sh  --manual-cleanup-hook /root/cleanup_godaddy.sh
0 6 * * * certbot certonly -d '*.eamode.cloud' --manual --preferred-challenges dns --keep-until-expiring --quiet --manual-public-ip-logging-ok --manual-auth-hook /root/authenticator_godaddy.sh  --manual-cleanup-hook /root/cleanup_godaddy.sh
```
## Developer
```shell
# Creating soft-link on Windows
mklink /D <env_name> C:\Users\<user>\env\<env_name>
```
git filter-branch --force --index-filter "git rm --cached --ignore-unmatch k8s/env.yaml" --prune-empty --tag-name-filter cat -- --all


kubectl edit node ${NODE_NAME}

 configSource:
    configMap:
      kubeletConfigKey: kubelet
      name: my-node-config-7cfg8b5576
      namespace: kube-system