import React, {useState, useEffect, useRef} from "react"
import axios from 'axios'
import DatasetElement from "../components/DatasetElement"
import DatasetElementLoading from "../components/DatasetElementLoading"
import ProgressBar from "../components/ProgressBar"

function EvaluateModelPopup({setShowEvaluateModelPopup, model_id, currentProfile, BACKEND_URL, notification, activateConfirmPopup}) {

    const [datasets, setDatasets] = useState([])
    const [savedDatasets, setSavedDatasets] = useState([])

    const [isEvaluating, setIsEvaluating] = useState(false)
    const [evaluationProgress, setEvaluationProgress] = useState(0)

    const [loading, setLoading] = useState(false)

    const [sortDatasets, setSortDatasets] = useState("downloads")
    const [search, setSearch] = useState("")

    const [sortSavedDatasets, setSortSavedDatasets] = useState("downloads")
    const [searchSaved, setSearchSaved] = useState("")

    const [showImage, setShowImage] = useState(true)
    const [showText, setShowText] = useState(true)

    const [showDatasetType, setShowDatasetType] = useState(false)

    const [datasetTypeShown, setDatasetTypeShown] = useState("my")  // "my" or "saved"

    const [accuracy, setAccuracy] = useState([])  // List over accuracy for trained epochs
    const [loss, setLoss] = useState([])  // Same as above but for loss

    const [wasEvaluated, setWasEvaluated] = useState(false)


    useEffect(() => {
        getDatasets()
    }, [])

    useEffect(() => {
        if (currentProfile && currentProfile.saved_datasets) {
            setSavedDatasets(sort_saved_datasets(currentProfile.saved_datasets))
        }
    }, [currentProfile])

    function getDatasets() {
        setLoading(true)
        axios({
            method: 'GET',
            url: window.location.origin + '/api/my-datasets/' + (search ? "?search=" + search : ""),
        })
        .then((res) => {
            if (res.data) {
                setDatasets(sort_datasets(res.data))
            } else {
                setDatasets([])
            }

        }).catch((err) => {
            notification("An error occured while loading your datasets.", "failure")
            console.log(err)
        }).finally(() => {
            setLoading(false)
        })
    }

    function evaluateModel(dataset_id) {
        const URL = window.location.origin + '/api/evaluate-model/'
        const config = {headers: {'Content-Type': 'application/json'}}

        let data = {
            "model": model_id,
            "dataset": dataset_id,
        }

        axios.defaults.withCredentials = true;
        axios.defaults.xsrfHeaderName = 'X-CSRFTOKEN';
        axios.defaults.xsrfCookieName = 'csrftoken';    

        if (isEvaluating) {return}
        setIsEvaluating(true)
        setEvaluationProgress(0)

        axios.post(URL, data, config)
        .then((res) => {
            data = res.data

            notification("Successfully evaluated dataset.", "success")

            setAccuracy(res.data["accuracy"])
            setLoss(res.data["loss"])

            setWasEvaluated(true)

        }).catch((error) => {
            console.log(error)
            if (error.status == 400) {
                notification(error.response.data["Bad request"], "failure")
            } else {
                notification("Error: " + error, "failure")
            }

            
        }).finally(() => {
            setEvaluationProgress(100)

            setTimeout(() => {
                setIsEvaluating(false)
                setEvaluationProgress(0)
            }, 200)

        })
    }

    function sort_datasets(ds) {
        let tempDatasets = [...ds]

        tempDatasets.sort((d1, d2) => {
            if (sortDatasets == "downloads") {
                if (d1.downloaders.length != d2.downloaders.length) {
                    return d2.downloaders.length - d1.downloaders.length
                } else {
                    return d1.name.localeCompare(d2.name)
                }
                
            } else if (sortDatasets == "alphabetical") {
                return d1.name.localeCompare(d2.name)
            } else if (sortDatasets == "date") {
                return new Date(d2.created_at) - new Date(d1.created_at)
            } else if (sortDatasets == "elements") {
                if (d1.elements.length != d2.elements.length) {
                    return d2.elements.length - d1.elements.length
                } else {
                    return d1.name.localeCompare(d2.name)
                }
                
            } else if (sortDatasets == "labels") {
                if (d1.labels.length != d2.labels.length) {
                    return d2.labels.length - d1.labels.length
                } else {
                    return d1.name.localeCompare(d2.name)
                }
                
            }
        })

        return tempDatasets

    }

    function sort_saved_datasets(ds) {
        let tempDatasets = [...ds]
        
        tempDatasets.sort((d1, d2) => {
            if (sortSavedDatasets == "downloads") {
                if (d1.downloaders.length != d2.downloaders.length) {
                    return d2.downloaders.length - d1.downloaders.length
                } else {
                    return d1.name.localeCompare(d2.name)
                }
            } else if (sortSavedDatasets == "alphabetical") {
                return d1.name.localeCompare(d2.name)
            } else if (sortSavedDatasets == "date") {
                return new Date(d2.created_at) - new Date(d1.created_at)
            } else if (sortSavedDatasets == "elements") {
                if (d1.elements.length != d2.elements.length) {
                    return d2.elements.length - d1.elements.length
                } else {
                    return d1.name.localeCompare(d2.name)
                }
            } else if (sortSavedDatasets == "labels") {
                if (d1.labels.length != d2.labels.length) {
                    return d2.labels.length - d1.labels.length
                } else {
                    return d1.name.localeCompare(d2.name)
                }
                
            }
        })

        return tempDatasets
    }

    useEffect(() => {
        if (!loading && savedDatasets.length > 0) {
            setSavedDatasets(sort_saved_datasets(savedDatasets))
        }
    }, [sortSavedDatasets])
    
    useEffect(() => {
        if (!loading) {
            setDatasets(sort_datasets(datasets))
        }
    }, [sortDatasets])


    const firstSearch = useRef(true)
    // Search input timing
    useEffect(() => {
        if (firstSearch.current) {
            firstSearch.current = false; // Set to false after first render
            return;
        }
        // Set a timeout to update debounced value after 500ms
        setLoading(true)
        const handler = setTimeout(() => {
            getDatasets()
        }, 350);
    
        // Cleanup the timeout if inputValue changes before delay
        return () => {
            clearTimeout(handler);
        };
    }, [search]);

    const firstSavedSearch = useRef(true)
    // Search input timing
    useEffect(() => {
        if (firstSavedSearch.current) {
            firstSavedSearch.current = false; // Set to false after first render
            return;
        }
        // Set a timeout to update debounced value after 500ms
        setLoading(true)
        const handler = setTimeout(() => {
            if (searchSaved.length > 0) {
                let temp = [...savedDatasets]
                temp = temp.filter((dataset) => {
                    return dataset.name.toLowerCase().startsWith(searchSaved.toLowerCase())
                })
                setSavedDatasets(sort_saved_datasets(temp))
            } else {
                setSavedDatasets(sort_saved_datasets(currentProfile.saved_datasets))
            }
            setLoading(false)
        }, 350);
    
        // Cleanup the timeout if inputValue changes before delay
        return () => {
            clearTimeout(handler);
        };
    }, [searchSaved]);


    function datasetOnClick(dataset) {
        activateConfirmPopup("Are you sure you want to evaluate this model on the dataset " + dataset.name + "?", () => {
            evaluateModel(dataset.id)
        }, "blue")
    }


    return (
        <div className="popup train-model-popup" onClick={() => setShowEvaluateModelPopup(false)}>

            {isEvaluating && <ProgressBar progress={evaluationProgress} message="Evaluating..." BACKEND_URL={BACKEND_URL}></ProgressBar>}

            {!wasEvaluated && <div className="train-model-popup-container" onClick={(e) => {
                e.stopPropagation()
            }}>
                <div className="explore-datasets-title-container">
                    <h1 className="create-layer-popup-title">Evaluate model</h1>

                    <div className="title-forms">
                        <div className="dataset-type-options-container" onClick={(e) => {
                            e.stopPropagation()
                        }}>
                            <button className="dataset-type-options-button" onClick={(e) => {
                                
                                setShowDatasetType(!showDatasetType)
                            }}>
                                Types<img className="dataset-type-options-icon" src={BACKEND_URL + "/static/images/down.svg"}/>
                            </button>
                            
                            {showDatasetType && <div className="dataset-type-options">
                                <div className="explore-datasets-type">
                                    <input className="explore-datasets-checkbox" type="checkbox" id="image" checked={showImage} onChange={() => {
                                        setShowImage(!showImage)
                                    }}/>
                                    <label htmlFor="image" className="explore-label">Image</label>
                                </div>
                                
                                <div className="explore-datasets-type no-margin"> 
                                    <input className="explore-datasets-checkbox" type="checkbox" id="text" checked={showText} onChange={() => {
                                        setShowText(!showText)
                                    }}/> 
                                    <label htmlFor="text" className="explore-label">Text</label>
                                </div>
                            </div>}
                        </div>

                        {datasetTypeShown == "my" && <select title="Sort by" className="explore-datasets-sort" value={sortDatasets} onChange={(e) => {
                                setSortDatasets(e.target.value)
                            }}>
                            <option value="downloads">Downloads</option>
                            <option value="elements">Elements</option>
                            <option value="labels">Labels</option>
                            <option value="alphabetical">Alphabetical</option>
                            <option value="date">Created</option>
                        </select>}
                        {datasetTypeShown == "saved" && <select title="Sort by" className="explore-datasets-sort" value={sortSavedDatasets} onChange={(e) => {
                                setSortSavedDatasets(e.target.value)
                            }}>
                            <option value="downloads">Downloads</option>
                            <option value="elements">Elements</option>
                            <option value="labels">Labels</option>
                            <option value="alphabetical">Alphabetical</option>
                            <option value="date">Created</option>
                        </select>}
                        
                        {datasetTypeShown == "my" && <div className="explore-datasets-search-container">
                            <input title="Will search names and keywords." type="text" className="explore-datasets-search" value={search} placeholder="Search datasets" onChange={(e) => {
                                    setLoading(true)
                                    setSearch(e.target.value)
                            }} /> 
                            <img className="explore-datasets-search-icon" src={BACKEND_URL + "/static/images/search.png"} />
                        </div>}
                        {datasetTypeShown == "saved" && <div className="explore-datasets-search-container">
                            <input title="Will search names and keywords." type="text" className="explore-datasets-search" value={searchSaved} placeholder="Search datasets" onChange={(e) => {
                                    setLoading(true)
                                    setSearchSaved(e.target.value)
                            }} /> 
                            <img className="explore-datasets-search-icon" src={BACKEND_URL + "/static/images/search.png"} />
                        </div>}
                    </div>
                </div>
                
                <p className="create-layer-popup-description">
                    You can evaluate the model on your own datasets, as well as any public datasets you've saved.
                    Warnings will appear when attempting to evaluate on invalid datasets. Make sure that the input dimensions match the dataset.
                    Note that only labelled elements in the dataset will be used for evaluation, and that evaluation currently only supports classification datasets.
                </p>

                <div className="train-model-row">
                    <div className="train-model-dataset-type-container">
                        <div className={"train-model-dataset-type-left train-model-dataset-type " + (datasetTypeShown == "my" ? "train-model-dataset-type-selected" : "")}
                        onClick={() => setDatasetTypeShown("my")}>My datasets</div>
                        <div className={"train-model-dataset-type-right train-model-dataset-type " + (datasetTypeShown == "saved" ? "train-model-dataset-type-selected" : "")}
                        onClick={() => setDatasetTypeShown("saved")}>Saved datasets</div>
                    </div>
                </div>
                

                {datasetTypeShown == "my" && <div className="my-datasets-container" style={{padding: 0, justifyContent: "center"}}>
                    {datasets.map((dataset) => (
                        ((dataset.dataset_type.toLowerCase() == "image" ? showImage : showText) ? <div title={(dataset.datatype == "classification" ? "Evaluate on this dataset": "Area datasets not supported.")} key={dataset.id} onClick={() => {
                            if (dataset.datatype == "classification") {
                                datasetOnClick(dataset)
                            } else {
                                notification("Evaluation on area datasets is not yet supported.", "failure")
                            }

                        }}
                        className="dataset-element-training-outer">
                            <DatasetElement isPublic={true} dataset={dataset} isTraining={true} BACKEND_URL={BACKEND_URL} isDeactivated={dataset.datatype != "classification"}/>
                        </div> : "")
                    ))}
                    {!loading && datasets.length == 0 && search.length > 0 && <p className="gray-text">No such datasets found.</p>}
                    {loading && datasets.length == 0 && currentProfile.datasetsCount > 0 && [...Array(currentProfile.datasetsCount)].map((e, i) => (
                        <DatasetElementLoading key={i} BACKEND_URL={BACKEND_URL} isPublic={true} isTraining={true}/>
                    ))}
                </div>}

                {savedDatasets && datasetTypeShown == "saved" && <div className="my-datasets-container" style={{padding: 0, justifyContent: "center"}}>
                    {savedDatasets.map((dataset) => (
                        (((dataset.dataset_type.toLowerCase() == "image" ? showImage : showText)) ? <div title={(dataset.datatype == "classification" ? "Evaluate on this dataset": "Area datasets not supported.")} key={dataset.id} onClick={() => {
                            if (dataset.datatype == "classification") {
                                datasetOnClick(dataset)
                            } else {
                                notification("Evaluation on area datasets is not yet supported.", "failure")
                            }
                        }}
                        className="dataset-element-training-outer">
                            <DatasetElement dataset={dataset} BACKEND_URL={BACKEND_URL} isPublic={true} isTraining={true} isDeactivated={dataset.datatype != "classification"}/>
                        </div> : "")
                    ))}
                    {!loading && currentProfile && savedDatasets.length == 0 && searchSaved.length == 0 && <p>You don't have any saved datasets.</p>}
                    {!loading && currentProfile && savedDatasets.length == 0 && searchSaved.length > 0 && <p className="gray-text">No such saved datasets found.</p>}
                    {loading && currentProfile && savedDatasets.length == 0 && currentProfile.saved_datasets && currentProfile.saved_datasets.length > 0 && currentProfile.saved_datasets.map((e, i) => (
                        <DatasetElementLoading key={i} BACKEND_URL={BACKEND_URL} isPublic={true} isTraining={true}/>
                    ))}
                </div>}
                
            </div>}

            {wasEvaluated && <div className="train-model-popup-container" onClick={(e) => {
                e.stopPropagation()
            }}>
                <div className="explore-datasets-title-container">
                    <h1 className="create-layer-popup-title successfully-trained-title">Successfully evaluated model <img className="trained-successfully-icon" src={BACKEND_URL + "/static/images/blueCheck.png"}/></h1>
                </div>

                <div className="trained-model-epochs">
                    <div className="trained-model-epoch">
                        <span className="epoch-accuracy">Accuracy: {accuracy * 100 + "%"}</span>Loss: {loss}
                    </div>
                </div>
            </div>}
        </div>
    )
}


export default EvaluateModelPopup