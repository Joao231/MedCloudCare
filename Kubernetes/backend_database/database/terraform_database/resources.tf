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


resource "kubernetes_deployment" "pgdamin" {
  metadata {
    name      = "pgadmin"
    namespace = "default"
    labels = {
          app = "pgadmin"
    }
  }
  spec {
    replicas = 1
    selector {
      match_labels = {
        app = "pgdamin"
      }
    }
    template {
      metadata {
        labels = {
          app = "pgdamin"
        }
      }
      spec {
        container {
          image = "dpage/pgadmin4"
          name  = "pgadmin4"
          env {
            name = "PGADMIN_DEFAULT_EMAIL"
            value = "joaomsalves1999@hotmail.com"
          }
          env{
            name = "PGADMIN_DEFAULT_PASSWORD"
            value = "admin"
          }
          env{
            name = "PGADMIN_PORT"
            value = "80"
          }
          port {
            name = "pgadminport"
            container_port = 80
          }
        }
      }
    }
  }
}

resource "kubernetes_service" "pgadmin_service" {
  metadata {
    name = "pgadmin"
    namespace = "default"
    labels = {
          app = "pgadmin"
    }
  }
  spec {
    port {
      node_port   = 30200
      port        = 8090
      target_port = 80
    }
    selector = {
      app = "pgdamin"
    }
    type = "LoadBalancer"
  }
}

resource "kubernetes_stateful_set" "postgres" {
  metadata {
    name      = "postgres"
    namespace = "default"
  }
  spec {
    service_name = "postgresql-db-service"
    replicas = 1
    selector {
      match_labels = {
        app = "postgres"
      }
    }
    template {
      metadata {
        labels = {
          app = "postgres"
          tier = "backend"
        }
        
      }
     spec {
        container {
          image = "postgres:latest"
          name  = "postgres"
          image_pull_policy = "IfNotPresent"
          env_from {
            config_map_ref {
              name = "postgres-config"
            }
          }
          port {
            container_port = 5432
          }
          volume_mount {
            name = "postgredb"
            mount_path = "/var/lib/postgresql/data"
          }
        }
        volume {
            name = "postgredb"
            persistent_volume_claim {
                    claim_name = kubernetes_persistent_volume_claim.postgres_claim.metadata.0.name
            }
        }
      }
    }
  }
}

resource "kubernetes_persistent_volume" "postgres_volume" {
  metadata {
    name = "postgres-pv-volume"
    labels = {
      type = "local"
      app = "postgres"
    }
  }
  spec {
    storage_class_name = "manual"
    capacity = {
      storage = "5Gi"
    }
    access_modes = ["ReadWriteMany"]
    persistent_volume_source {
      host_path {
        path = "/mnt/db_postgres"
      }
    }
  }
}

resource "kubernetes_persistent_volume_claim" "postgres_claim" {
  metadata {
    name = "postgres-pv-claim"
    labels = {
      app = "postgres"
    }
  }
  spec {
    storage_class_name = "manual"
    access_modes = ["ReadWriteMany"]
    resources {
      requests = {
        storage = "5Gi"
      }
    }
    volume_name = "postgres-pv-volume"
  }
}

resource "kubernetes_config_map" "postgres_config" {
  metadata {
    name = "postgres-config"
    labels = {
      app = "postgres"
    }
  }
  data = {
    POSTGRES_DB: "postgresdb"
    POSTGRES_USER: "postgres"
    POSTGRES_PASSWORD: "Barcelona99"
    POSTGRES_DB: "postgres"
  }
}

resource "kubernetes_service" "postgres_service" {
  metadata {
    name = "postgres"
    namespace = "default"
    labels = {
      app = "postgres"
    }
  }
  spec {
    port {
      node_port   = 30432
      port        = 5432
      target_port = 5432
    }
    selector = {
      app = "postgres"
    }
    type = "NodePort"
  }
}


