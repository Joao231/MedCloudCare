# Healthcare-App
App to help doctors to quickly analyse medical images and researchers to deploy ML models

First install:
Docker - https://docs.docker.com/get-docker/

Minikube - https://minikube.sigs.k8s.io/docs/start/

Minikube ingress - https://kubernetes.io/docs/tasks/access-application-cluster/ingress-minikube/

Terraform - https://www.terraform.io/downloads

Go to Django folder in backend and open settings.py file and put a value in keys and IDs for the social accounts and also the email and password for sending emails.
In script/cifra.py file and scripts/decifra.py file put a value for master_key and master_iv variables.

Second, open 7 command line windows

In the first one, run minikube start. Then, go to the frontend root folder and run "yarn install" and "yarn build"


In the second window, go to "kubernetes/orthanc/terraform_orthanc" folder and run these commands:
"terraform init", "terraform plan" and "terraform apply".


In the third window, go to "kubernetes/orthanc/terraform_orthanc_2" folder and run these commands:
"terraform init", "terraform plan" and "terraform apply".


In the fourth window, go to "kubernetes/backend_database/database/terraform_database" folder and run these commands:
"terraform init", "terraform plan" and "terraform apply".


In the fifth window, run this command "& minikube -p minikube docker-env --shell powershell | Invoke-Expression"
Go to the "kubernetes/frontend" folder and run "docker build -t frontend:1 -f Dockerfile <path_to_frontend_root_folder>". Then, go to "kubernetes/frontend/terraform_frontend" and run these commands:
"terraform init", "terraform plan" and "terraform apply".


In the sixth window, run this command "& minikube -p minikube docker-env --shell powershell | Invoke-Expression"
Go to the "kubernetes/backend_database/backend" folder and run "docker build -t backend:1 -f Dockerfile <path_to_backend_Django_root_folder>". Then, go to "kubernetes/backend_database/backend/terraform_backend" and run these commands:
"terraform init", "terraform plan" and "terraform apply".


In the seventh window just run the command "minikube tunnel".



Now, you can close all windows except the last one.

Finally, open your favourite browser and write localhost to use the app.
