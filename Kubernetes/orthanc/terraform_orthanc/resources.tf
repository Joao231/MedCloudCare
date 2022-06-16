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

resource "kubernetes_deployment" "orthanc" {
    metadata {
        name      = "orthanc"
        namespace = "default"
        labels = {
          app = "orthanc"
        }
    }
    spec {
        replicas = 1
        selector {
            match_labels = {
                app = "orthanc"
            }
        }
        template {
            metadata {
                labels = {
                    app = "orthanc"
                }
            }
        
          spec {
              volume {
                  name = "orthanc-conf"
                  persistent_volume_claim {
                      claim_name = kubernetes_persistent_volume_claim.orthanc_claim.metadata.0.name
                  }
              }
              volume {
                  name = "orthanc-db"
                  persistent_volume_claim {
                      claim_name = kubernetes_persistent_volume_claim.orthanc_claim_db.metadata.0.name
                  }
              }
              container {
                  image = "jodogne/orthanc-plugins"
                  name  = "orthanc-container"
                  image_pull_policy = "Never"
                  port{
                    name = "http-server"
                    container_port = 8046
                  }
                  port{
                    name = "dicom-server"
                    container_port = 4242
                  }
                  volume_mount {
                      name = "orthanc-conf"
                      mount_path = "/etc/orthanc"
                  }
                  volume_mount {
                      name = "orthanc-db"
                      mount_path = "/var/lib/orthanc/db/"
                  }
              }
          }
        }
    }
}

resource "kubernetes_service" "orthanc_service" {
  metadata {
    name      = "orthanc-service"
    namespace = "default"
  }
  spec {
    selector = {
      app = kubernetes_deployment.orthanc.spec.0.template.0.metadata.0.labels.app
    }
    port{
      name        = "http"
      port        = 8047
      target_port = 8046
    }
    port{
      name        = "tcp"
      port        = 4242
      target_port = 4242
    }
    type = "NodePort"
  }
}

resource "kubernetes_persistent_volume" "orthanc_volume" {
  metadata {
    name = "orthanc-volume"
    labels = {
      type = "local"
    }
  }
  spec {
    storage_class_name = "standard"
    capacity = {
      storage = "10Gi"
    }
    access_modes = ["ReadWriteOnce"]
    persistent_volume_source {
      host_path {
        path = "/data"
      }
    }
  }
}

resource "kubernetes_persistent_volume" "orthanc_volume_db" {
  metadata {
    name = "orthanc-volume-db"
    labels = {
      type = "local"
    }
  }
  spec {
    storage_class_name = "standard"
    capacity = {
      storage = "10Gi"
    }
    access_modes = ["ReadWriteOnce"]
    persistent_volume_source {
      host_path {
        path = "/orthanc_db"
      }
    }
  }
}

resource "kubernetes_persistent_volume_claim" "orthanc_claim" {
  metadata {
    name = "orthanc-claim"
  }
  spec {
    storage_class_name = "standard"
    access_modes = ["ReadWriteOnce"]
    resources {
      requests = {
        storage = "3Gi"
      }
    }
    volume_name = "${kubernetes_persistent_volume.orthanc_volume.metadata.0.name}"
  }
}

resource "kubernetes_persistent_volume_claim" "orthanc_claim_db" {
  metadata {
    name = "orthanc-claim-db"
  }
  spec {
    storage_class_name = "standard"
    access_modes = ["ReadWriteOnce"]
    resources {
      requests = {
        storage = "3Gi"
      }
    }
    volume_name = "${kubernetes_persistent_volume.orthanc_volume_db.metadata.0.name}"
  }
}