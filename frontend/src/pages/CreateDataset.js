import React, {useState} from "react"
import {useNavigate} from "react-router-dom"
import axios from "axios"


function CreateDataset() {

    const navigate = useNavigate()
    const [type, setType] = useState("classification")
    const [name, setName] = useState("")
    const [description, setDescription] = useState("")
    const [image, setImage] = useState(null)
    const [visibility, setVisibility] = useState("private")

    const [uploadDropdownVisible, setUploadDropdownVisible] = useState(true)

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
                        console.log(e.currentTarget.value)
                    }} />
                    <label htmlFor="create-dataset-type-image" className="create-dataset-type-label">Classification</label>
                    <input type="radio" id="create-dataset-type-text" name="area" value="area" checked={type == "area"}  onChange={(e) => {
                        setType(e.target.value)
                        console.log(e.currentTarget.value)
                    }} />
                    <label htmlFor="create-dataset-type-text" className="create-dataset-type-label">Area</label>
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
                    <label className="create-dataset-label" htmlFor="create-dataset-image">Image <span className="create-dataset-required">(required)</span></label>
                    <input type="file" accept="image/*" id="create-dataset-image" name="image" required className="create-dataset-file-inp" onChange={(e) => {
                        if (e.target.files[0]) {
                            setImage(e.target.files[0])
                        }
                    }} />
                </div>

                <h1 className="create-dataset-title create-dataset-subtitle upload-dataset-title" onClick={() => {
                        setUploadDropdownVisible(!uploadDropdownVisible)
                    }}>Upload dataset 
                    <span className="create-dataset-title-optional">(optional)</span>
                    <img style={{rotate: (uploadDropdownVisible ? "180deg" : "0deg")}} className="upload-dataset-dropdown" src={window.location.origin + "/static/images/down.svg"}/>
                </h1>
                
                {uploadDropdownVisible && <div className="upload-dataset-form">
                    <p className="create-dataset-description" >By uploading a dataset, this dataset will be created with the elements and labels provided. You can upload several datasets, of two different types seen below.</p>
                
                    <div className="upload-dataset-types-container">
                        <div className="upload-dataset-type-col">
                            <p className="upload-dataset-type-title">Folders as labels</p>
                            <p className="upload-dataset-type-description">
                                Will create labels for all subfolders in the uploaded folder, with elements in each subfolder belonging to that label.
                            </p>

                            <div className="upload-dataset-type-image-container">
                                <img className="upload-dataset-type-image" src={window.location.origin + "/static/images/foldersAsLabels.jpg"} />
                            </div>
                            
                            <div className="upload-dataset-label-inp">
                                <label className="create-dataset-label" htmlFor="foldersAsLabelsInp">Datasets</label>
                                <input type="file" id="foldersAsLabelsInp" name="foldersAsLabels" className="create-dataset-file-inp"/>
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

                            <div className="upload-dataset-label-inp">
                                <label className="create-dataset-label" htmlFor="filenameAsLabelsInp">Datasets</label>
                                <input type="file" id="filenameAsLabelsInp" name="filenameAsLabels" className="create-dataset-file-inp"/>
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