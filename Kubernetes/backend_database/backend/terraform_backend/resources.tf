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

resource "kubernetes_deployment" "django_deployment" {
  metadata {
    name      = "django"
    namespace = "default"
    labels = {
          app = "django"
        }
  }
  spec {
    replicas = 1
    selector {
      match_labels = {
        app = "django"
      }
    }
    template {
      metadata {
        labels = {
          app = "django"
        }
      }
      spec {
        container {
          image = "backend:1"
          name  = "django"
          image_pull_policy = "Never"
          command = ["sh", "run.sh"]
          port {
            container_port = 8000
          }
          env_from {
            config_map_ref {
              name = "postgres-config"
            }
          }
          env {
            name = "POSTGRES_PORT"
            value = "5432"
          }
          env {
            name = "POSTGRES_HOST"
            value = "postgres"
          }
          volume_mount {
            name = "docker-sock"
            mount_path = "/var/run/docker.sock"
          }
          volume_mount {
            name = "media-files"
            mount_path = "/usr/src/app/media"
          }
        }
        volume {
          name = "docker-sock"
          host_path {
              path = "/var/run/docker.sock"
          }
        }
        volume {
          name = "media-files"
          host_path {
              path = "/usr/src/app/media"
          }
        }
      }
    }
  }
}

resource "kubernetes_service" "django_service" {
  metadata {
    name = "django-service"
    namespace = "default"
  }
  spec {
    port {
      protocol   = "TCP"
      port        = 80
      target_port = 8000
    }
    selector = {
      app = kubernetes_deployment.django_deployment.spec.0.template.0.metadata.0.labels.app
    }
    type = "NodePort"
  }
}




resource "kubernetes_cluster_role" "django_role" {
  metadata {
    name = "pods-list"
  }

  rule {
    api_groups = ["", "apps", "networking.k8s.io"]
    resources  = ["pods", "services", "deployments", "ingresses"]
    verbs      = ["list", "create", "delete", "patch"]
  }
}

resource "kubernetes_cluster_role_binding" "django_role_binding" {
  metadata {
    name = "pods-list"
  }
  role_ref {
    api_group = "rbac.authorization.k8s.io"
    kind      = "ClusterRole"
    name      = "pods-list"
  }
  subject {
    kind      = "ServiceAccount"
    name      = "default"
    namespace = "default"
  }
}


