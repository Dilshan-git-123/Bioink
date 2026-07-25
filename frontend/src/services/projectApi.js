const API_URL = "http://127.0.0.1:8000";

// Helper to convert backend project structure to frontend format
export function mapProjectToFrontend(bp) {
  if (!bp) return null;
  return {
    projectId: bp.id,
    projectName: bp.name,
    description: bp.description || "",
    status: bp.status || "Draft",
    createdAt: bp.created_date, // ISO string which formatTimestamp parses on the fly
    lastModified: bp.last_modified_date, // ISO string
    selectedTissue: bp.tissue_type || "",
    materials: bp.biomaterial_formulation || [],
    finalMixing: bp.final_mixing_parameters || null,
    prediction: bp.prediction_results || null,
    protocol: bp.generated_protocol || null,
  };
}

// Helper to convert frontend project structure to backend format
export function mapProjectToBackend(fp) {
  if (!fp) return null;
  
  const getIsoString = (ts) => {
    if (!ts) return new Date().toISOString();
    if (typeof ts === 'string') return ts;
    return ts.iso || new Date().toISOString();
  };

  return {
    name: fp.projectName,
    description: fp.description || "",
    tissue_type: fp.selectedTissue || "",
    biomaterial_formulation: fp.materials || [],
    final_mixing_parameters: fp.finalMixing || {},
    prediction_results: fp.prediction || {},
    generated_protocol: fp.protocol || {},
    status: fp.status || "Draft",
    created_date: getIsoString(fp.createdAt),
    last_modified_date: getIsoString(fp.lastModified)
  };
}

export async function fetchProjects() {
  const response = await fetch(`${API_URL}/projects`);
  if (!response.ok) {
    throw new Error("Failed to fetch projects from backend");
  }
  const data = await response.json();
  return data.map(mapProjectToFrontend);
}

export async function fetchProjectById(id) {
  const response = await fetch(`${API_URL}/projects/${id}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch project ${id} from backend`);
  }
  const data = await response.json();
  return mapProjectToFrontend(data);
}

export async function createBackendProject(projectData) {
  // projectData is a frontend project object
  const backendData = mapProjectToBackend(projectData);
  const response = await fetch(`${API_URL}/projects`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(backendData),
  });
  if (!response.ok) {
    throw new Error("Failed to create project on backend");
  }
  const data = await response.json();
  return mapProjectToFrontend(data);
}

export async function updateBackendProject(id, updates) {
  // updates can be partial frontend project properties
  const backendUpdates = {};
  
  if (updates.projectName !== undefined) backendUpdates.name = updates.projectName;
  if (updates.description !== undefined) backendUpdates.description = updates.description;
  if (updates.selectedTissue !== undefined) backendUpdates.tissue_type = updates.selectedTissue;
  if (updates.materials !== undefined) backendUpdates.biomaterial_formulation = updates.materials;
  if (updates.finalMixing !== undefined) backendUpdates.final_mixing_parameters = updates.finalMixing;
  if (updates.prediction !== undefined) backendUpdates.prediction_results = updates.prediction;
  if (updates.protocol !== undefined) backendUpdates.generated_protocol = updates.protocol;
  if (updates.status !== undefined) backendUpdates.status = updates.status;

  const response = await fetch(`${API_URL}/projects/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(backendUpdates),
  });
  if (!response.ok) {
    throw new Error(`Failed to update project ${id} on backend`);
  }
  const data = await response.json();
  return mapProjectToFrontend(data);
}

export async function deleteBackendProject(id) {
  const response = await fetch(`${API_URL}/projects/${id}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    throw new Error(`Failed to delete project ${id} from backend`);
  }
  return await response.json();
}
