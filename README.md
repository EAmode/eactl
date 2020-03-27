# eactl
EA Mode management CLI. Managing infrastructure and applications

## ssh shell access 
```shell
ssh prod-admin@eamode.com -i env/mode/prod-admin.private
ssh prod-admin@wbg.eamode.com -i env/wbg/prod/prod-admin.private
```

## Certificates
```shell
sudo certbot certonly --manual --preferred-challenges dns --server https://acme-v02.api.letsencrypt.org/directory -d '*.eamode.com'
sudo certbot --nginx -d example.com -d stage.example.com -d www.example.com
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