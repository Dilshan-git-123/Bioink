import "../styles/materialBuilder.css";


const emptyMaterial = {
  biomaterial: "",
  concentration: "",
  temperature: "",
  rpm: "",
  time: "",
  method: ""
};

function MaterialBuilder({
  materials,
  setMaterials
}) {

  const addMaterial = () => {
    setMaterials([
      ...materials,
      { ...emptyMaterial }
    ]);
  };

  const updateMaterial = (index, field, value) => {

    const updated = [...materials];

    updated[index][field] = value;

    setMaterials(updated);

  };

  const predictBioink = () => {

  console.clear();

  console.log("========== BIOINK INPUT ==========");

  console.table(materials);

  console.log("==================================");

};

  return (

    <div className="material-builder">

      <div className="builder-header">

        <h2>🧪 Material Builder</h2>

        <button
          className="add-material-btn"
          onClick={addMaterial}
        >
          + Add Material
        </button>

      </div>

      {

        materials.map((material,index)=>(

          <div
            className="material-card"
            key={index}
          >

            <div className="material-title">

  <h3>

    Material {index + 1}

  </h3>

  {

    materials.length > 1 && (

      <button

        className="remove-btn"

        onClick={() => {

          const updated = materials.filter(
            (_, i) => i !== index
          );

          setMaterials(updated);

        }}

      >

        🗑 Remove

      </button>

    )

  }

</div>

            <div className="form-grid">

              <div className="form-group">

                <label>Biomaterial</label>

                <select
                  value={material.biomaterial}
                  onChange={(e)=>
                    updateMaterial(
                      index,
                      "biomaterial",
                      e.target.value
                    )
                  }
                >

                  <option value="">
                    Select
                  </option>

                  <option>Alginate</option>

                  <option>Gelatin</option>

                  <option>Collagen</option>

                  <option>GelMA</option>

                  <option>Pectin</option>

                </select>

              </div>

              <div className="form-group">

                <label>Concentration (%)</label>

                <input
                  type="number"
                  value={material.concentration}
                  onChange={(e)=>
                    updateMaterial(
                      index,
                      "concentration",
                      e.target.value
                    )
                  }
                />

              </div>

              <div className="form-group">

                <label>Preparation Temperature</label>

                <input
                  type="number"
                  value={material.temperature}
                  onChange={(e)=>
                    updateMaterial(
                      index,
                      "temperature",
                      e.target.value
                    )
                  }
                />

              </div>

              <div className="form-group">

                <label>Mixing RPM</label>

                <input
                  type="number"
                  value={material.rpm}
                  onChange={(e)=>
                    updateMaterial(
                      index,
                      "rpm",
                      e.target.value
                    )
                  }
                />

              </div>

              <div className="form-group">

                <label>Mixing Time</label>

                <input
                  type="number"
                  value={material.time}
                  onChange={(e)=>
                    updateMaterial(
                      index,
                      "time",
                      e.target.value
                    )
                  }
                />

              </div>

              <div className="form-group">

                <label>Mixing Method</label>

                <select
                  value={material.method}
                  onChange={(e)=>
                    updateMaterial(
                      index,
                      "method",
                      e.target.value
                    )
                  }
                >

                  <option value="">
                    Select
                  </option>

                  <option>Magnetic Stirrer</option>

                  <option>Manual</option>

                  <option>Orbital Shaker</option>

                </select>

              </div>

            </div>

          </div>

        ))

            }


    </div>

  );

}

export default MaterialBuilder;