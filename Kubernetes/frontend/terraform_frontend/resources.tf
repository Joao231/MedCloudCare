terraform {
  required_providers {
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = ">= 2.0.0"
    }
  }
}
provider "kubernetes" {
  config_path = "~/.kube/config"
}


resource "kubernetes_secret" "frontend-app-tls" {
  metadata {
    name = "frontend-app-tls"
    namespace = "default"
  }

  data = {
    "server.crt" = file("D:/tese/Kubernetes/frontend/tls.crt")
    "server.key" = file("D:/tese/Kubernetes/frontend/tls.key")
  }

  type = "Opaque"
}

resource "kubernetes_deployment" "frontend" {
  metadata {
    name      = "frontend"
    namespace = "default"
  }
  spec {
    replicas = 3
    selector {
      match_labels = {
        app = "frontend"
      }
    }
    template {
      metadata {
        labels = {
          app = "frontend"
        }
      }
      spec {
        container {
          image = "frontend:1"
          name  = "frontend"
          image_pull_policy = "Never"
          port {
            container_port = 80
          }
        }
      }
    }
  }
}

resource "kubernetes_service" "service_frontend" {
  metadata {
    name      = "frontend"
    namespace = "default"
  }
  spec {
    selector = {
      app = kubernetes_deployment.frontend.spec.0.template.0.metadata.0.labels.app
    }
    type = "NodePort"
    port {
      protocol   = "TCP"
      port        = 80
      target_port = 80
    }
  }
}

resource "kubernetes_ingress_v1" "ingress_frontend" {
  metadata {
    name = "ingress-frontend"
    namespace = "default"
    annotations = {
      "kubernetes.io/ingress.class" = "nginx"
      "nginx.ingress.kubernetes.io/rewrite-target": "/$1"
      "nginx.ingress.kubernetes.io/service-upstream": "true"
      "nginx.ingress.kubernetes.io/ssl-redirect": "false"
      "nginx.ingress.kubernetes.io/proxy-body-size": "500m"
      "nginx.ingress.kubernetes.io/proxy-read-timeout": "3600"
      "nginx.ingress.kubernetes.io/proxy-connect-timeout": "3600"
      "nginx.ingress.kubernetes.io/proxy-send-timeout": "3600"
      "nginx.ingress.kubernetes.io/send-timeout": "3600"
    }
  }
  spec {
    rule {
      host = "localhost"
      http {
        path {
          path = "/(.*)"
          backend {
            service {
              name = kubernetes_service.service_frontend.metadata.0.name
            
              port {
                number = 80
              }
            }
          }
        }
      }
    }
    tls {
      hosts = ["localhost"]
      secret_name = "frontend-app-tls"
    }
  }
}