import React, {useState, useRef} from "react"
import {useNavigate} from "react-router-dom"
import axios from "axios"


function CreateDataset() {

    const navigate = useNavigate()
    const [type, setType] = useState("classification")
    const [name, setName] = useState("")
    const [description, setDescription] = useState("")
    const [image, setImage] = useState(null)
    const [visibility, setVisibility] = useState("private")
    const [keywordCurrent, setKeywordCurrent] = useState("")
    const [keywords, setKeywords] = useState([])

    const [uploadDropdownVisible, setUploadDropdownVisible] = useState(false)

    const [uploadedFoldersAsLabels, setUploadedFoldersAsLabels] = useState([])
    const [uploadedFilenamesAsLabels, setUploadedFilenamesAsLabels] = useState([])

    const [uploadedDatasets, setUploadedDatasets] = useState({}) // Labels as keys, with the value as an array of files with that label

    const hiddenFolderInputRef = useRef(null)
    const hiddenFilenamesInputRef = useRef(null)

    const INVALID_LABELS = new Set(["name", "datatype", "description", "image", "visibility", "labels"]) // Would impact formData below, temporary fix

    function formOnSubmit(e) {
        e.preventDefault()

        axios.defaults.withCredentials = true;
        axios.defaults.xsrfHeaderName = 'X-CSRFTOKEN';
        axios.defaults.xsrfCookieName = 'csrftoken';    

        let formData = new FormData()


        formData.append('name', name)
        formData.append('datatype', type)
        formData.append('description', description)
        formData.append('image', image)
        formData.append("visibility", visibility)
        formData.append("keywords", JSON.stringify(keywords))

        Object.entries(uploadedDatasets).forEach(([key, fileList]) => {
            formData.append("labels", key)
            fileList.forEach((file) => {
                formData.append(key, file)
            })
        })

        const URL = window.location.origin + '/api/create-dataset/'
        const config = {headers: {'Content-Type': 'multipart/form-data'}}

        axios.post(URL, formData, config)
        .then((data) => {
            console.log("Success:", data);
            navigate("/home")
        }).catch((error) => {
            alert("An error occurred.")
            console.log("Error: ", error)
        })
    }

    function folderInputClick() {
        if (hiddenFolderInputRef.current) {
            hiddenFolderInputRef.current.click();
        }
    }

    function filenamesInputClick() {
        if (hiddenFilenamesInputRef.current) {
            hiddenFilenamesInputRef.current.click();
        }
    }

    function uploadFoldersAsLabels(e) {
        try {
            let files = e.target.files
            
            let tempObj = {...uploadedDatasets}    // Label name as key and value as an array of elements
            for (let i=0; i < files.length; i++) {
                let file = files[i]
                if (i == 0) {
                    let temp = [...uploadedFoldersAsLabels]
                    temp.push(file.webkitRelativePath.split("/")[0])
                    setUploadedFoldersAsLabels(temp)
                }
                let label = file.webkitRelativePath.split("/")[1].toLowerCase()
                if (INVALID_LABELS.has(label)) {
                    alert("Invalid label: ", label + ". Labels cannot be one of " + INVALID_LABELS)
                    continue
                }
                
                if (tempObj[label] == null) {tempObj[label] = []}
                tempObj[label].push(file)
            }

            setUploadedDatasets(tempObj)

        } catch (e) {
            alert("Error: ", e + ". This may be due to incorrect formatting of uploaded dataset.")
        }

    }

    function uploadFilenamesAsLabels(e) {
        try {
            let files = e.target.files
            
            let tempObj = {...uploadedDatasets}    // Label name as key and value as an array of elements

            for (let i=0; i < files.length; i++) {
                let file = files[i]
                if (i == 0) {
                    let temp = [...uploadedFilenamesAsLabels]
                    temp.push(file.webkitRelativePath.split("/")[0])
                    setUploadedFilenamesAsLabels(temp)
                }
                let label = file.name.split("_")[0].toLowerCase()
                if (INVALID_LABELS.has(label)) {
                    alert("Invalid label: ", label + ". Labels cannot be one of " + INVALID_LABELS)
                    continue
                }

                if (tempObj[label] == null) {tempObj[label] = []}
                tempObj[label].push(file)
            }

            setUploadedDatasets(tempObj)

        } catch (e) {
            alert("Error: ", e + ". This may be due to incorrect formatting of uploaded dataset.")
        }
    }

    return (
        <div className="create-dataset-container">
            <form className="create-dataset-form" onSubmit={formOnSubmit}>
                <h1 className="create-dataset-title">Create a dataset</h1>
                <p className="create-dataset-description">Datasets allow you to upload files (images or text) and label these accordingly. Datasets can then be passed to models in order to train or evaluate these.</p>

                <div className="create-dataset-label-inp">
                    <label className="create-dataset-label" htmlFor="name">Dataset name <span className="create-dataset-required">(required)</span></label>
                    <input className="create-dataset-inp" name="name" type="text" required value={name} onChange={(e) => {
                        setName(e.target.value)
                    }} />
                </div>

                <div className="create-dataset-label-inp">
                    <p className="create-dataset-label create-dataset-type">Dataset type</p>
                    <input type="radio" id="create-dataset-type-image" name="classification" value="classification" checked={type == "classification"} onChange={(e) => {
                        setType(e.target.value)
                    }} />
                    <label htmlFor="create-dataset-type-image" className="create-dataset-type-label">Classification</label>
                    <input type="radio" id="create-dataset-type-text" name="area" value="area" checked={type == "area"}  onChange={(e) => {
                        setType(e.target.value)
                    }} />
                    <label htmlFor="create-dataset-type-text" className="create-dataset-type-label">Area <span className="create-dataset-required">(images only)</span></label>
                </div>

                <div className="create-dataset-label-inp">
                    <label className="create-dataset-label" htmlFor="description">Description</label>
                    <input className="create-dataset-inp create-dataset-full-width" name="description" type="text" value={description} onChange={(e) => {
                        setDescription(e.target.value)
                    }} />
                </div>

                <div className="create-dataset-label-inp">
                    <p className="create-dataset-label create-dataset-type">Dataset visibility</p>
                    <input type="radio" id="create-dataset-visibility-private" name="visibility" value="private" checked={visibility == "private"} onChange={(e) => {
                        setVisibility(e.target.value)
                    }} />
                    <label htmlFor="create-dataset-visibility-private" className="create-dataset-type-label">Private</label>
                    <input type="radio" id="create-dataset-visibility-public" name="visibility" value="public" checked={visibility == "public"}  onChange={(e) => {
                        setVisibility(e.target.value)
                    }} />
                    <label htmlFor="create-dataset-visibility-public" className="create-dataset-type-label">Public</label>
                </div>

                <div className="create-dataset-label-inp">
                    <label className="create-dataset-label">Keywords <span className="create-dataset-required">({keywords.length}/3)</span></label>

                    <div className="create-dataset-keywords-inp-container">
                        <input type="text" className="create-dataset-keywords-inp" value={keywordCurrent} onChange={(e) => {
                            setKeywordCurrent(e.target.value)
                        }} />
                        <button type="button" className="create-dataset-keywords-button" onClick={() => {
                            if (keywords.length < 3) {
                                if (!keywords.includes(keywordCurrent.toLowerCase()) && keywordCurrent.length > 0) {
                                    let temp = [...keywords]
                                    temp.push(keywordCurrent.toLowerCase())
                                    setKeywords(temp)
                                    setKeywordCurrent("")
                                }
                                
                            } else {
                                alert("You can only add three keywords.")
                            }
                            
                        }}>
                            <img className="create-dataset-keywords-icon" src={window.location.origin + "/static/images/plus.png"} />
                            Add
                        </button>
                    </div>
                    
                </div>

                {keywords.length > 0 && <div className="create-dataset-keywords-container">
                    {keywords.map((e, i) => (
                        <div key={i} className="create-dataset-keyword-element">
                            {e}
                            <img className="create-dataset-keyword-element-remove" src={window.location.origin + "/static/images/cross.svg"} onClick={() => {
                                let temp = [...keywords]
                                temp = temp.filter((keyword) => keyword != e)
                                setKeywords(temp)
                            }}/>
                        </div>
                    ))}
                </div>}

                <div className="create-dataset-label-inp">
                    <label className="create-dataset-label" htmlFor="create-dataset-image">Image <span className="create-dataset-required">(required)</span></label>
                    <input type="file" accept="image/png, image/jpeg, image/webp" id="create-dataset-image" name="image" required className="create-dataset-file-inp" onChange={(e) => {
                        if (e.target.files[0]) {
                            setImage(e.target.files[0])
                        }
                    }} />
                </div>

                { type == "classification" && <h1 className="create-dataset-title create-dataset-subtitle upload-dataset-title" onClick={() => {
                        setUploadDropdownVisible(!uploadDropdownVisible)
                    }}>Upload dataset 
                    <span className="create-dataset-title-optional">(optional)</span>
                    <img style={{rotate: (uploadDropdownVisible ? "180deg" : "0deg")}} className="upload-dataset-dropdown" src={window.location.origin + "/static/images/down.svg"}/>
                </h1>}
                
                {uploadDropdownVisible && type == "classification" && <div className="upload-dataset-form">
                    <p className="create-dataset-description" >
                        By uploading a dataset, this dataset will be created with the elements and labels provided. 
                        You can upload several datasets, of two different types seen below.
                        Note that improper formatting of uploaded datasets (see instructions below) may result in errors or incorrect labels.
                        Also note that label names will be set to lowercase.
                    </p>
                
                    <div className="upload-dataset-types-container">
                        {/* Uploading datasets goes through these */}
                        <input id="folders-as-labels-upload-inp" type="file" className="hidden" directory="" webkitdirectory="" ref={hiddenFolderInputRef} onChange={(e) => uploadFoldersAsLabels(e)}/>
                        <input id="folders-as-labels-upload-inp" type="file" className="hidden" directory="" webkitdirectory="" ref={hiddenFilenamesInputRef} onChange={(e) => uploadFilenamesAsLabels(e)}/>

                        <div className="upload-dataset-type-col">
                            <p className="upload-dataset-type-title">Folders as labels</p>
                            <p className="upload-dataset-type-description">
                                Will create labels for all subfolders in the uploaded folder, with elements in each subfolder belonging to that label.
                            </p>

                            <div className="upload-dataset-type-image-container">
                                <img className="upload-dataset-type-image" src={window.location.origin + "/static/images/foldersAsLabels.jpg"} />
                            </div>
                            
                            <button type="button" className="upload-dataset-button" onClick={folderInputClick}>
                                <img className="upload-dataset-button-icon" src={window.location.origin + "/static/images/upload.svg"} />
                                Upload dataset
                            </button>

                            <div className="uploaded-dataset-element-container">
                                {uploadedFoldersAsLabels.map((e, i) => (
                                    <p title={e} key={i} className="uploaded-dataset-element">{e}</p>
                                ))}
                            </div>
                            
                        </div>
                        

                        <div className="upload-dataset-type-col">
                            <p className="upload-dataset-type-title">Filenames as labels</p>
                            <p className="upload-dataset-type-description">
                                Will create labels for every filename before the character '_' with such files belonging to that label, e.g. label1_2 will be read as belonging to label 1.
                            </p>

                            <div className="upload-dataset-type-image-container">
                                <img className="upload-dataset-type-image" src={window.location.origin + "/static/images/filenamesAsLabels.jpg"} />
                            </div>

                            <button type="button" className="upload-dataset-button" onClick={filenamesInputClick}>
                                <img className="upload-dataset-button-icon" src={window.location.origin + "/static/images/upload.svg"} />
                                Upload dataset
                            </button>

                            <div className="uploaded-dataset-element-container">
                                {uploadedFilenamesAsLabels.map((e, i) => (
                                    <p title={e} key={i} className="uploaded-dataset-element">{e}</p>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>}

                <div className="create-dataset-buttons">
                    <button type="button" className="create-dataset-cancel" onClick={() => navigate("/home")}>Cancel</button>
                    <button type="submit" className="create-dataset-submit">Create dataset</button>
                </div>
                
            
            </form>
        </div>
    )
}

export default CreateDataset