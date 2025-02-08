import React, { useState, useEffect, useRef } from "react"
import DatasetElement from "../components/DatasetElement"
import DatasetElementLoading from "../components/DatasetElementLoading"
import { useNavigate } from "react-router-dom"
import axios from 'axios'

function Explore({checkLoggedIn, BACKEND_URL}) {
    const navigate = useNavigate()

    const [datasets, setDatasets] = useState([])

    const [typeShown, setTypeShown] = useState("datasets") // Either "datasets" or "models"

    const [sort, setSort] = useState("downloads")
    const [search, setSearch] = useState("")
    const [showClassification, setShowClassification] = useState(true)
    const [showArea, setShowArea] = useState(true)

    const [loading, setLoading] = useState(true)
    const [showDatasetType, setShowDatasetType] = useState(false)

    useEffect(() => {
        getDatasets()
    }, [])

    const getDatasets = () => {
        setLoading(true)
        axios({
            method: 'GET',
            url: window.location.origin + '/api/datasets/' + (search ? "?search=" + search : ""),
        })
        .then((res) => {
            if (res.data) {
                setDatasets(sortDatasets(res.data))
            } else {
                setDatasets([])
            }

        }).catch((err) => {
            alert("An error occured while loading your datasets.")
            console.log(err)
        }).finally(() => {
            setLoading(false)
        })

    }

    function sortDatasets(ds) {

        let tempDatasets = [...ds]

        
        tempDatasets.sort((d1, d2) => {
            if (sort == "downloads") {
                if (d1.downloaders.length != d2.downloaders.length) {
                    return d2.downloaders.length - d1.downloaders.length
                } else {
                    return d1.name.localeCompare(d2.name)
                }
                
            } else if (sort == "alphabetical") {
                return d1.name.localeCompare(d2.name)
            } else if (sort == "date") {
                return new Date(d2.created_at) - new Date(d1.created_at)
            } else if (sort == "elements") {
                if (d1.elements.length != d2.elements.length) {
                    return d2.elements.length - d1.elements.length
                } else {
                    return d1.name.localeCompare(d2.name)
                }
                
            } else if (sort == "labels") {
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
        if (!loading) {
            setDatasets(sortDatasets(datasets))
        }
    }, [sort])


    // Search input timing
    const firstSearch = useRef(true)
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


    return <div className="explore-container">
        <div className="home-sidebar">
            <button className="sidebar-button" onClick={() => {
                checkLoggedIn("/create-dataset")
            }}>+ Create dataset</button>
            <button title="Work in progress" className="sidebar-button sidebar-button-disabled create-model">+ Create model</button>
            
            <div className="sidebar-types-container">
                <div className={"sidebar-types-element " + (typeShown == "datasets" ? "sidebar-types-element-selected" : "")}
                onClick={() => setTypeShown("datasets")}>
                    <img className="sidebar-types-element-icon" src={BACKEND_URL + "/static/images/database.svg"} />Datasets
                </div>
                <div className={"sidebar-types-element " + (typeShown == "models" ? "sidebar-types-element-selected" : "")}
                onClick={() => setTypeShown("models")}>
                    <img className="sidebar-types-element-icon" src={BACKEND_URL + "/static/images/modelSidebar.svg"} />Models
                </div>
            </div>

        </div>
        <div className="explore-non-sidebar">
            {typeShown == "datasets" && <div>
                <div className="explore-datasets-title-container">
                    <h2 className="explore-datasets-title">Public Datasets</h2>

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
                                    <input className="explore-datasets-checkbox" type="checkbox" id="classification" name="classification" checked={showClassification} onChange={() => {
                                        setShowClassification(!showClassification)
                                    }}/>
                                    <label htmlFor="classification" className="explore-label">Classification</label>
                                </div>
                                
                                <div className="explore-datasets-type no-margin"> 
                                    <input className="explore-datasets-checkbox" type="checkbox" id="area" name="area" checked={showArea} onChange={() => {
                                        setShowArea(!showArea)
                                    }}/> 
                                    <label htmlFor="area" className="explore-label">Area</label>
                                </div>
                            </div>}
                        </div>

                        <select title="Sort by" className="explore-datasets-sort" value={sort} onChange={(e) => {
                            setSort(e.target.value)
                        }}>
                            <option value="downloads">Downloads</option>
                            <option value="elements">Elements</option>
                            <option value="labels">Labels</option>
                            <option value="alphabetical">Alphabetical</option>
                            <option value="date">Date</option>
                        </select>
                        
                        <div className="explore-datasets-search-container">
                            <input title="Will search names and keywords." type="text" className="explore-datasets-search" value={search} placeholder="Search datasets" onChange={(e) => {
                                    setLoading(true)
                                    setSearch(e.target.value)
                            }} /> 
                            <img className="explore-datasets-search-icon" src={BACKEND_URL + "/static/images/search.png"} />
                        </div>
                    </div>
                    

                    
                </div>
                
                <div className="my-datasets-container">
                    {datasets.map((dataset) => (
                        ((dataset.datatype == "classification" ? showClassification : showArea) ? <DatasetElement dataset={dataset} key={dataset.id} isPublic={true} BACKEND_URL={BACKEND_URL}/> : "")
                    ))}

                    {loading && datasets.length == 0 && [...Array(4)].map((e, i) => (
                        <DatasetElementLoading key={i} isPublic={true} BACKEND_URL={BACKEND_URL}/>
                    ))}
                    {!loading && datasets.length == 0 && search.length > 0 && <p className="gray-text">No such datasets found.</p>}
                </div>
                
            </div>}
        </div>
        

        
    </div>
}

export default Explore