import "../styles/finalMixing.css";

function FinalMixing({
  finalMixing,
  setFinalMixing
}) {

  const updateField = (field, value) => {

    setFinalMixing({
      ...finalMixing,
      [field]: value
    });

  };

  return (

    <div className="final-mixing">

      <h2>
        ⚙ Final Mixing Parameters
      </h2>

      <div className="mix-grid">

        <div>

          <label>
            Final Mixing Temperature (°C)
          </label>

          <input
            type="number"
            value={finalMixing.temperature}
            onChange={(e) =>
              updateField("temperature", e.target.value)
            }
            placeholder="37"
          />

        </div>

        <div>

          <label>
            Final Mixing Time (min)
          </label>

          <input
            type="number"
            value={finalMixing.time}
            onChange={(e) =>
              updateField("time", e.target.value)
            }
            placeholder="20"
          />

        </div>

        <div>

          <label>
            Final Mixing RPM
          </label>

          <input
            type="number"
            value={finalMixing.rpm}
            onChange={(e) =>
              updateField("rpm", e.target.value)
            }
            placeholder="250"
          />

        </div>

        <div>

          <label>
            Crosslinking Method
          </label>

          <select
            value={finalMixing.crosslinking}
            onChange={(e) =>
              updateField("crosslinking", e.target.value)
            }
          >

            <option value="CaCl₂">CaCl₂</option>

            <option value="UV">UV</option>

            <option value="Thermal">Thermal</option>

            <option value="None">None</option>

          </select>

        </div>

      </div>

    </div>

  );

}

export default FinalMixing;