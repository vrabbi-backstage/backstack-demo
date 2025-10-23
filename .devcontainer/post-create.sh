#!/bin/bash
set -e

echo "Setting up Backstack Demo environment..."
kind create cluster --name backstack-demo --config kind/config.yaml

echo "Install Cert Manager..."
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.19.1/cert-manager.yaml

echo "Install Ingres NGINX..."
kubectl apply -f https://kind.sigs.k8s.io/examples/ingress/deploy-ingress-nginx.yaml
kubectl wait --namespace ingress-nginx \
  --for=condition=ready pod \
  --selector=app.kubernetes.io/component=controller \
  --timeout=5m

echo "Install Kyverno..."
helm repo add kyverno https://kyverno.github.io/kyverno/
helm repo update
helm install kyverno kyverno/kyverno -n kyverno --create-namespace --wait

echo "Install Crossplane..."
helm repo add crossplane-stable https://charts.crossplane.io/stable
helm repo update
helm install crossplane --namespace crossplane-system --create-namespace crossplane-stable/crossplane --wait

echo "Install ArgoCD..."
kubectl create ns argocd
kubectl apply -f https://raw.githubusercontent.com/argoproj/argo-cd/refs/heads/master/manifests/install.yaml -n argocd

echo "Create Backstage RBAC..."
kubectl create namespace backstage-system
kubectl create serviceaccount -n backstage-system backstage-user
kubectl create -f- <<EOF
apiVersion: v1
kind: Secret
metadata:
  name: backstage-token
  namespace: backstage-system
  annotations:
    kubernetes.io/service-account.name: backstage-user
type: kubernetes.io/service-account-token
EOF
kubectl create -f- <<EOF
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: backstage-kubernetes-rbac
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: cluster-admin
subjects:
- kind: ServiceAccount
  name: backstage-user
  namespace: backstage-system
EOF

echo "Configure Crossplane..."
kubectl create clusterrolebinding --serviceaccount crossplane-system:crossplane --clusterrole cluster-admin allow-all-resources-crossplane
kubectl apply -f crossplane/01-functions
kubectl apply -f crossplane/02-providers
kubectl wait --for condition=Healthy=true providers.p crossplane-contrib-provider-kubernetes --timeout 10m
kubectl apply -f crossplane/03-provider-configs
kubectl apply -f crossplane/04-xrds --recursive
kubectl apply -f crossplane/05-compositions --recursive
kubectl apply -f crossplane/06-examples --recursive

echo "Configure Kyverno..."
kubectl apply -f kyverno/

echo "Create Cluster Issuer..."
kubectl apply -f cert-manager/ca-issuer.yaml

echo "Setup complete!"
echo ""
echo "Next steps:"
echo "  1. Set up your environment variables (GITHUB_TOKEN, GITHUB_CLIENT_ID, etc.)"
echo "  2. Render and Apply ArgoCD AppSet"
echo "  3. Render Backstage values file"
echo "  4. Deploy Backstage"
echo ""
