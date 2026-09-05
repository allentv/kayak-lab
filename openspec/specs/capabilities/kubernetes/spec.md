# kubernetes Specification

## Purpose

Kubernetes API capability with real REST API calls. Provides authenticated access to Kubernetes clusters for pod, deployment, service, and namespace management.

## Requirements

### Requirement: Kubernetes authentication

The Kubernetes capability MUST authenticate using in-cluster config, kubeconfig, or a provided token.

#### Scenario: In-cluster config
- **WHEN** running inside a Kubernetes pod
- **THEN** the capability uses the service account token and API server URL from the environment

#### Scenario: Kubeconfig
- **WHEN** running outside the cluster
- **THEN** the capability reads `~/.kube/config` for cluster connection details

### Requirement: Kubernetes resource operations

The Kubernetes capability MUST execute real Kubernetes API calls.

#### Scenario: List pods
- **WHEN** `listPods(namespace)` is called
- **THEN** `GET /api/v1/namespaces/{namespace}/pods` is called and real pod data is returned

#### Scenario: Get deployment status
- **WHEN** `getDeploymentStatus(name, namespace)` is called
- **THEN** `GET /apis/apps/v1/namespaces/{namespace}/deployments/{name}` is called and real deployment status is returned

#### Scenario: List events
- **WHEN** `listEvents(namespace)` is called
- **THEN** `GET /api/v1/namespaces/{namespace}/events` is called and real events are returned
