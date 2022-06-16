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

resource "kubernetes_deployment" "orthanc_2" {
    metadata {
        name      = "orthanc2"
        namespace = "default"
        labels = {
          app = "orthanc2"
        }
    }
    spec {
        replicas = 1
        selector {
            match_labels = {
                app = "orthanc2"
            }
        }
        template {
            metadata {
                labels = {
                    app = "orthanc2"
                }
            }
        
          spec {
              volume {
                  name = "orthanc-conf2"
                  persistent_volume_claim {
                      claim_name = kubernetes_persistent_volume_claim.orthanc_claim_2.metadata.0.name
                  }
              }
              volume {
                  name = "orthanc-db2"
                  persistent_volume_claim {
                      claim_name = kubernetes_persistent_volume_claim.orthanc_claim_db_2.metadata.0.name
                  }
              }
              container {
                  image = "jodogne/orthanc-plugins"
                  name  = "orthanc-container2"
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
                      name = "orthanc-conf2"
                      mount_path = "/etc/orthanc"
                  }
                  volume_mount {
                      name = "orthanc-db2"
                      mount_path = "/var/lib/orthanc/db/"
                  }
              }
          }
        }
    }
}

resource "kubernetes_service" "orthanc_service_2" {
  metadata {
    name      = "orthanc-service2"
    namespace = "default"
  }
  spec {
    selector = {
      app = kubernetes_deployment.orthanc_2.spec.0.template.0.metadata.0.labels.app
    }
    port{
      name        = "http"
      port        = 8048
      target_port = 8046
    }
    port{
      name        = "tcp"
      port        = 4243
      target_port = 4242
    }
    type = "NodePort"
  }
}

resource "kubernetes_persistent_volume" "orthanc_volume_2" {
  metadata {
    name = "orthanc-volume-2"
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

resource "kubernetes_persistent_volume" "orthanc_volume_db_2" {
  metadata {
    name = "orthanc-volume-db-2"
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
        path = "/orthanc_db_2"
      }
    }
  }
}

resource "kubernetes_persistent_volume_claim" "orthanc_claim_2" {
  metadata {
    name = "orthanc-claim-2"
  }
  spec {
    storage_class_name = "standard"
    access_modes = ["ReadWriteOnce"]
    resources {
      requests = {
        storage = "3Gi"
      }
    }
    volume_name = "${kubernetes_persistent_volume.orthanc_volume_2.metadata.0.name}"
  }
}

resource "kubernetes_persistent_volume_claim" "orthanc_claim_db_2" {
  metadata {
    name = "orthanc-claim-db-2"
  }
  spec {
    storage_class_name = "standard"
    access_modes = ["ReadWriteOnce"]
    resources {
      requests = {
        storage = "3Gi"
      }
    }
    volume_name = "${kubernetes_persistent_volume.orthanc_volume_db_2.metadata.0.name}"
  }
}