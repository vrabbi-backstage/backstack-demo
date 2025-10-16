# Setup Port-Forwarding
As we are working in a simple kind cluster without ingress or Service LB support we will use a port-forward to the ArgoCD Server to access ArgoCD from the CLI or the UI
```bash
kubectl port-forward -n argocd svc/argocd-server 8080:443 &
```

# Configure the ArgoCD CLI
```bash
export ARGOCD_ADMIN_PASSWORD=`kubectl get secret -n argocd argocd-initial-admin-secret -o jsonpath='{.data.password}' | base64 --decode`
argocd login --username admin --password $ARGOCD_ADMIN_PASSWORD localhost:8080 --insecure
```

# Open the ArgoCD UI
* Retrieve the Admin Password
  ```bash
  export ARGOCD_ADMIN_PASSWORD=`kubectl get secret -n argocd argocd-initial-admin-secret -o jsonpath='{.data.password}' | base64 --decode`
  echo "ArgoCD Admin Password: ${ARGOCD_ADMIN_PASSWORD}"
  ```
* Go to https://localhost:8080
* Login with the username `admin` and the password retrieved above

# Stop the Port Forward
```bash
kill $(ps -ef | grep '[k]ubectl port-forward -n argocd svc/argocd-server' | awk '{print $2}')
```
