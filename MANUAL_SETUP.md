# Manual Setup Instructions
## Pre Requisites
1. [kubectl](https://kubernetes.io/docs/tasks/tools/#kubectl)
2. [kind](https://kind.sigs.k8s.io/docs/user/quick-start/#installing-from-release-binaries)
3. [helm](https://helm.sh/docs/intro/install/#from-script)
4. [yarn v2](https://yarnpkg.com/getting-started/install)
5. [node 20](https://nodejs.org/en/download)
6. [git](https://git-scm.com/book/en/v2/Getting-Started-Installing-Git)

## Manual Preperation Steps:
1. [Create Github PAT](https://github.com/settings/tokens/new)
2. [Create Github Oauth App](https://github.com/settings/applications/new)
    * Application Name: Backstage
    * Homepage URL: http://localhost:3000
    * Authorization Callback URL: http://localhost:7007/api/auth/github
3. Copy the Client ID
4. Create a Client Secret and copy it
5. Update first User Manifests Username from vrabbi to your Github Username in [the relevant file](./backstage/examples/org.yaml)  

## Configure and Deploy the BackStack

### Export Github Variables
```bash
export GITHUB_TOKEN=""
export GITHUB_CLIENT_ID=""
export GITHUB_CLIENT_SECRET=""
export GITHUB_OWNER=""
export GITHUB_REPO=""
```

### Create Kind Cluster
```bash
kind create cluster --name backstack-demo --config kind/config.yaml
```
### Install Kyverno
```bash
helm repo add kyverno https://kyverno.github.io/kyverno/
helm repo update
helm install kyverno kyverno/kyverno -n kyverno --create-namespace
```
### Install Crossplane
```bash
helm repo add crossplane-stable https://charts.crossplane.io/stable
helm repo update
helm install crossplane --namespace crossplane-system --create-namespace crossplane-stable/crossplane
```

### Install ArgoCD
```bash
kubectl create ns argocd
kubectl apply -f https://raw.githubusercontent.com/argoproj/argo-cd/refs/heads/master/manifests/install.yaml -n argocd
```

### Configure Crossplane
```bash
kubectl create clusterrolebinding --serviceaccount crossplane-system:crossplane --clusterrole cluster-admin allow-all-resources-crossplane
kubectl apply -f crossplane/01-functions
kubectl apply -f crossplane/02-providers
kubectl wait --for condition=Healthy=true providers.p crossplane-contrib-provider-kubernetes
kubectl apply -f crossplane/03-provider-configs
kubectl apply -f crossplane/04-xrds --recursive
kubectl apply -f crossplane/05-compositions --recursive
kubectl apply -f crossplane/06-examples --recursive
```

### Configure Kyverno Policies
```bash
kubectl apply -f kyverno/
```

### Configure Argo AppSet
```bash
envsubst <argo/app-set-template.yaml > argo/app-set-rendered.yaml
kubectl apply -f argo/app-set-rendered.yaml
```

### Create RBAC for Backstage to communicate with K8s Cluster
```bash
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
```

### Export Kubernetes Cluster Details
```bash
export KUBERNETES_URL=`kubectl config view --raw --minify -o jsonpath='{.clusters[0].cluster.server}'`
export KUBERNETES_SERVICE_ACCOUNT_TOKEN=`kubectl get secret -n backstage-system backstage-token -o jsonpath='{.data.token}' | base64 --decode`
export ARGOCD_ADMIN_PASSWORD=`kubectl get secret -n argocd argocd-initial-admin-secret -o jsonpath='{.data.password}' | base64 --decode`
```

## Start the Backstack

### Start Backstage
```bash
cd backstage/source
yarn install
export NODE_OPTIONS="--max_old_space_size=8192 --no-node-snapshot"
export NODE_TLS_REJECT_UNAUTHORIZED=0
yarn start
```

## Explore the app
To explore the different capabilities of the BACKStack and this implementation of the stack, we recommend fullowing our [Getting Started Guide](./docs/01-getting-started.md)
