import React, {useState} from "react"

function ModelDownloadPopup({model, setShowDownloadPopup, isDownloaded, setIsDownloaded, BACKEND_URL}) {

    const [format, setFormat] = useState(".keras")
    const [filename, setFilename] = useState(model.name)

    return (
        <div className="popup model-download-popup" onClick={() => {
            setShowDownloadPopup(false)
            setIsDownloaded(false)
        }}>
            {isDownloaded && <div className="model-download-popup-container" onClick={(e) => {
                e.stopPropagation()
            }}>
                <h1 className="download-successful-title">Download Successful <img className="download-successful-icon" src={BACKEND_URL + "/static/images/blueCheck.png"}/></h1>
                <p className="download-successful-instructions">An example of how the model can be loaded using TensorFlow will be added in later patches.
                </p>
                
            </div>}

            {!isDownloaded && <div className="model-download-popup-container" style={{width: "550px"}} onClick={(e) => {
                e.stopPropagation()
            }}>
                <h1 className="create-layer-popup-title">Download Model</h1>
                <p className="create-layer-popup-description">
                    This will save the model as a file on your computer. You can then load it using tools such as TensorFlow or PyTorch.
                    Note that this will download the latest built version of the model, not simply saved changes. 
                </p>

                <form className="model-download-form" onSubmit={(e) => {
                    e.preventDefault()
                }}>
                    <div className="create-dataset-label-inp">
                        <label className="create-dataset-label" htmlFor="model-filename">Filename</label>
                        <input className="create-dataset-inp" id="model-filename" type="text" required value={filename} onChange={(e) => {
                            setFilename(e.target.value)
                        }} />
                    </div>

                    <div className="create-dataset-label-inp">
                        <label className="create-dataset-label" htmlFor="model-format">File format</label>
                        <select className="create-dataset-inp" id="model-format" required value={format} onChange={(e) => {
                            setFormat(e.target.value)
                        }}>
                            <option value=".keras">.keras</option>
                        </select>
                    </div>

                    <div className="model-download-build-container">
                        <p className="model-download-build-title">Build Settings</p>

                        <div className="model-download-build-row">
                            <p className="model-download-build-label">Optimizer</p> 
                            <p className="model-download-build-value">{model.optimizer}</p>
                        </div>

                        <div className="model-download-build-row">
                            <p className="model-download-build-label">Loss function</p> 
                            <p className="model-download-build-value">{model.loss_function}</p>
                        </div>
                    </div>

                    <div className="create-layer-popup-buttons">
                        <button type="button" className="create-layer-popup-cancel" onClick={() => {setShowDownloadPopup(false)}}>Cancel</button>
                        <button type="submit" className="create-layer-popup-submit">
                            Download
                        </button>
                    </div>
                </form>

                
            </div>}

        </div>
    )
}


export default ModelDownloadPopup