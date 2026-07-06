import "../styles/protocolGenerator.css";

function ProtocolGenerator() {

    return (

        <div className="protocol">

            <div className="protocol-header">

                <h2>📋 Generated Laboratory Protocol</h2>

                <div>

                    <button>📄 PDF</button>

                    <button>🖨 Print</button>

                    <button>📋 Copy</button>

                </div>

            </div>

            <div className="protocol-card">

                <div className="step">

                    <h3>Step 1</h3>

                    <p>
                        Prepare each biomaterial individually using sterile conditions.
                    </p>

                </div>

                <div className="step">

                    <h3>Step 2</h3>

                    <p>
                        Mix the materials according to the specified RPM and temperature.
                    </p>

                </div>

                <div className="step">

                    <h3>Step 3</h3>

                    <p>
                        Crosslink the construct using the selected crosslinking method.
                    </p>

                </div>

                <div className="step">

                    <h3>Step 4</h3>

                    <p>
                        Load the bioink into the syringe and begin bioprinting.
                    </p>

                </div>

            </div>

        </div>

    )

}

export default ProtocolGenerator;