import unittest
import urllib.request
import urllib.error
import json

BASE_URL = "http://127.0.0.1:8000"

class TestProjectsAPI(unittest.TestCase):

    def send_request(self, method, path, data=None):
        url = f"{BASE_URL}{path}"
        req_data = None
        headers = {"Content-Type": "application/json"}
        
        if data is not None:
            req_data = json.dumps(data).encode("utf-8")
            
        req = urllib.request.Request(url, data=req_data, headers=headers, method=method)
        try:
            with urllib.request.urlopen(req) as res:
                body = res.read().decode("utf-8")
                return res.status, json.loads(body) if body else None
        except urllib.error.HTTPError as e:
            body = e.read().decode("utf-8")
            return e.code, json.loads(body) if body else None

    def test_project_crud(self):
        # 1. Create a project
        payload = {
            "name": "Test Project",
            "description": "Test Description",
            "tissue_type": "skin",
            "biomaterial_formulation": [
                {
                    "biomaterial": "alginate",
                    "concentration": 3.0,
                    "temperature": 25.0,
                    "rpm": 200,
                    "time": 10,
                    "method": "ionic"
                }
            ],
            "final_mixing_parameters": {
                "temperature": 30,
                "rpm": 250,
                "time": 5,
                "crosslinking": "CaCl2"
            },
            "prediction_results": {
                "printability": 8.0,
                "viability": 9.0
            },
            "generated_protocol": {
                "steps": ["Step 1", "Step 2"]
            },
            "status": "Draft"
        }
        
        status, data = self.send_request("POST", "/projects", payload)
        self.assertEqual(status, 200)
        self.assertIsNotNone(data.get("id"))
        self.assertEqual(data["name"], payload["name"])
        self.assertEqual(data["status"], "Draft")
        self.assertIsNotNone(data.get("created_date"))
        
        project_id = data["id"]
        
        # 2. Get list of projects
        status, projects = self.send_request("GET", "/projects")
        self.assertEqual(status, 200)
        self.assertTrue(len(projects) >= 1)
        self.assertTrue(any(p["id"] == project_id for p in projects))
        
        # 3. Get specific project
        status, fetched = self.send_request("GET", f"/projects/{project_id}")
        self.assertEqual(status, 200)
        self.assertEqual(fetched["id"], project_id)
        self.assertEqual(fetched["description"], payload["description"])
        
        # 4. Update project
        update_payload = {
            "name": "Updated Project Name",
            "status": "Completed",
            "tissue_type": "cartilage"
        }
        status, updated = self.send_request("PUT", f"/projects/{project_id}", update_payload)
        self.assertEqual(status, 200)
        self.assertEqual(updated["id"], project_id)
        self.assertEqual(updated["name"], "Updated Project Name")
        self.assertEqual(updated["status"], "Completed")
        self.assertEqual(updated["tissue_type"], "cartilage")
        self.assertEqual(updated["biomaterial_formulation"], payload["biomaterial_formulation"]) # should remain unchanged
        
        # 5. Delete project
        status, delete_res = self.send_request("DELETE", f"/projects/{project_id}")
        self.assertEqual(status, 200)
        self.assertEqual(delete_res, {"success": True})
        
        # 6. Verify deleted (should be 404)
        status, err_res = self.send_request("GET", f"/projects/{project_id}")
        self.assertEqual(status, 404)

if __name__ == "__main__":
    unittest.main()
