import React, {useEffect, useState, useRef} from "react"
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios"

import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import CreateLayerPopup from "../components/CreateLayerPopup";
import LayerElement from "../components/LayerElement";


// The default page. Login not required.
function Model({currentProfile, activateConfirmPopup, notification, BACKEND_URL}) {

    const { id } = useParams();
    const [model, setModel] = useState(null)
    const [layers, setLayers] = useState([])
    const [loading, setLoading] = useState(true)
    const [changed, setChanged] = useState(false)   // True if changes have been made since last load or build

    const [showDownloadPopup, setShowDownloadPopup] = useState(false)
    const [showCreateLayerPopup, setShowCreateLayerPopup] = useState(false)

    const [processingCreateLayer, setProcessingCreateLayer] = useState(false)

    const [showModelDescription, setShowModelDescription] = useState(false)
    const pageRef = useRef(null)
    const [descriptionWidth, setDescriptionWidth] = useState(45)    // As percentage

    const [toolbarLeftWidth, setToolbarLeftWidth] = useState(185)   // In pixels
    const [toolbarMainHeight, setToolbarMainHeight] = useState(50)

    const [hoveredLayerTimeout, setHoveredLayerTimeout] = useState(null)
    const [hoveredLayer, setHoveredLayer] = useState(null)  // id of hovered layer

    const [cursor, setCursor] = useState("")

    const descriptionContainerRef = useRef(null)

    const navigate = useNavigate()

    // Used to map layer types to colors in sidebar
    const typeToColor = {
        "dense": "purple",
        "conv2d": "lightblue"
    }

    useEffect(() => {
        getModel()
    }, [])

    useEffect(() => {
        if (currentProfile && model && !loading) {
            if (currentProfile.user && model.owner) {
                if (currentProfile.user != model.owner) {
                    navigate("/models/public/" + id)
                }
            }
            
        }
    }, [currentProfile, model])

    function getModel() {
        setLoading(true)
        axios({
            method: 'GET',
            url: window.location.origin + '/api/models/' + id,
        })
        .then((res) => {
            setModel(res.data)

            setLayers(res.data.layers)

            // preloadImages(res.data.elements) // Now handled by .hidden-preload
        }).catch((err) => {
            navigate("/")
            notification("An error occured when loading model with id " + id + ".", "failure")

            console.log(err)

        }).finally(() => {
            setLoading(false)
        })
    }


    function updateModel(data) {

    }


    function buildModel(e) {

    }


    // LAYER FUNCTIONALITY

    function getLayerName(layer) {
        if (layer.layer_type == "dense") {
            return "Dense - " + layer.nodes_count
        } else if (layer.layer_type == "conv2d") {
            return "Conv2D - (" + layer.filters + ", " + layer.kernel_size + ")"
        }
    }

    const layersHandleDragEnd = (result) => {
        if (!result.destination) return; // Dropped outside
    
        const reorderLayers = [...layers];
        const [movedItem] = reorderLayers.splice(result.source.index, 1);
        reorderLayers.splice(result.destination.index, 0, movedItem);
        
        setLayers(reorderLayers);

        let idToIdx = {}

        for (let i=0; i < reorderLayers.length; i++) {
            idToIdx[reorderLayers[i].id] = i
        }
        
        // For updating the order, so it stays the same after refresh
        const URL = window.location.origin + '/api/reorder-model-layers/'
        const config = {headers: {'Content-Type': 'application/json'}}

        let data = {
            "id": model.id,
            "order": idToIdx
        }

        axios.defaults.withCredentials = true;
        axios.defaults.xsrfHeaderName = 'X-CSRFTOKEN';
        axios.defaults.xsrfCookieName = 'csrftoken';    

        axios.post(URL, data, config)
        .then((data) => {

        }).catch((error) => {
            notification("Error: " + error, "failure")
            
        })
    };

    function createLayer(data) {
        setProcessingCreateLayer(true)

        data["model"] = model.id
        data["index"] = layers.length
        
        axios.defaults.withCredentials = true;
        axios.defaults.xsrfHeaderName = 'X-CSRFTOKEN';
        axios.defaults.xsrfCookieName = 'csrftoken';    
        
        const URL = window.location.origin + '/api/create-layer/'
        const config = {headers: {'Content-Type': 'application/json'}}

        axios.post(URL, data, config)
        .then((data) => {
            notification("Successfully created layer.", "success")
            
            getModel()
            
            setShowCreateLayerPopup(false)

        }).catch((error) => {
            notification("Error: " + error + ".", "failure")
        }).finally(() => {
            setProcessingCreateLayer(false)
        })
    }

    function deleteLayerInner(id) {
        axios.defaults.withCredentials = true;
        axios.defaults.xsrfHeaderName = 'X-CSRFTOKEN';
        axios.defaults.xsrfCookieName = 'csrftoken';    

        let data = {
            "layer": id
        }

        const URL = window.location.origin + '/api/delete-layer/'
        const config = {headers: {'Content-Type': 'application/json'}}

        setLoading(true)
        axios.post(URL, data, config)
        .then((data) => {

            getModel()

            notification("Successfully deleted label.", "success")

        }).catch((error) => {
            notification("Error: " + error + ".")

        }).finally(() => {
            setLoading(false)
        })
    }

    function deleteLayer(id) {
        activateConfirmPopup("Are you sure you want to delete this layer? This action cannot be undone.", () => deleteLayerInner(id))
    }

    // FRONTEND FUNCTIONALITY

    function closePopups(exception) {
        
    }

    const resizeLeftToolbarHandleMouseDown = (e) => {
        e.preventDefault();
    
        const startX = e.clientX;
        const startWidth = toolbarLeftWidth;

        setCursor("e-resize")
    
        const handleMouseMove = (e) => {
          const newWidth = startWidth + (e.clientX - startX)

          setToolbarLeftWidth(Math.max(135, Math.min(newWidth, 250)));  // Arbitrary max and min width
        };
    
        const handleMouseUp = () => {
            setCursor("")
          document.removeEventListener("mousemove", handleMouseMove);
          document.removeEventListener("mouseup", handleMouseUp);
        };
    
        document.addEventListener("mousemove", handleMouseMove);
        document.addEventListener("mouseup", handleMouseUp);
    };

    const resizeMainToolbarHandleMouseDown = (e) => {
        e.preventDefault();
    
        const startY = e.clientY;
        const startHeight = toolbarMainHeight;

        setCursor("n-resize")
    
        const handleMouseMove = (e) => {
          const newHeight = startHeight + (e.clientY - startY)
        
          if (newHeight < 25) { // Hide toolbar
            setToolbarMainHeight(15)
          } else {  // Show toolbar
            setToolbarMainHeight(50)
          }
        };
    
        const handleMouseUp = () => {
            setCursor("")
          document.removeEventListener("mousemove", handleMouseMove);
          document.removeEventListener("mouseup", handleMouseUp);
        };
    
        document.addEventListener("mousemove", handleMouseMove);
        document.addEventListener("mouseup", handleMouseUp);
    };

    const resizeDescriptionHandleMouseDown = (e) => {
        e.preventDefault();
    
        const startX = e.clientX;
        const startWidth = descriptionWidth;

        setCursor("e-resize")
    
        const handleMouseMove = (e) => {
          const newWidth = startWidth - 100 * ((e.clientX - startX) / descriptionContainerRef.current.offsetWidth);

          setDescriptionWidth(Math.max(35, Math.min(newWidth, 75)));
        };
    
        const handleMouseUp = () => {
            setCursor("")
          document.removeEventListener("mousemove", handleMouseMove);
          document.removeEventListener("mouseup", handleMouseUp);
        };
    
        document.addEventListener("mousemove", handleMouseMove);
        document.addEventListener("mouseup", handleMouseUp);
    };

    return (
        <div className="dataset-container" onClick={closePopups} ref={pageRef} style={{cursor: (cursor ? cursor : "")}}>

            {showCreateLayerPopup && <CreateLayerPopup BACKEND_URL={BACKEND_URL}
                                                    onSubmit={createLayer} 
                                                    setShowCreateLayerPopup={setShowCreateLayerPopup}
                                                    processingCreateLayer={processingCreateLayer}></CreateLayerPopup>}

            <div className="dataset-toolbar-left" style={{width: toolbarLeftWidth + "px"}}>
                <div className="model-toolbar-left-inner">
                    <p className={"dataset-sidebar-title " + (toolbarLeftWidth < 150 ? "dataset-sidebar-title-small" : "")}>Layers</p>

                    <div className="dataset-sidebar-button-container">
                        <button type="button" 
                        className={"sidebar-button dataset-upload-button " + (toolbarLeftWidth < 150 ? "sidebar-button-small" : "")} 
                        title="Add layer"
                        onClick={() => setShowCreateLayerPopup(true)}>
                            <img className={"dataset-upload-button-icon " + (toolbarLeftWidth < 150 ? "model-upload-button-icon-small" : "")} src={BACKEND_URL + "/static/images/plus.png"} />
                            <span>Add layer</span>
                        </button>
                    </div>

                    
                    <DragDropContext className="dataset-elements-list" onDragEnd={layersHandleDragEnd}>
                        <Droppable droppableId="models-droppable">
                            
                        {(provided) => (<div className="model-layers-list"
                        {...provided.droppableProps}
                        ref={provided.innerRef}>
                            {layers.map((layer, idx) => (
                                <Draggable key={layer.id} draggableId={"" + layer.id} index={idx}>
                                    {(provided) => (<div className="model-sidebar-layer"
                                    {...provided.draggableProps}
                                    {...provided.dragHandleProps}
                                    style={{...provided.draggableProps.style}}
                                    ref={provided.innerRef}
                                    title={getLayerName(layer)}
                                    onMouseEnter={() => {
                                        // Set a timeout to show the preview after 200ms
                                        const timeoutId = setTimeout(() => {
                                            setHoveredLayer(layer.id)
                                        }, 500);

                                        // Store the timeout ID so it can be cleared later
                                        setHoveredLayerTimeout(timeoutId);
                                        
                                    }}
                                    onMouseLeave={() => {
                                        clearTimeout(hoveredLayerTimeout);
                                        setHoveredLayer(null)
                                    }}>
                                        <span className={"model-sidebar-color model-sidebar-color-" + typeToColor[layer.layer_type]}></span>

                                        <span className="model-sidebar-layer-name">
                                            {getLayerName(layer)}
                                        </span>

                                        <img title="Delete layer" className="model-sidebar-delete" onClick={(e) => {
                                            e.stopPropagation()
                                            deleteLayer(layer.id)
                                        }} src={BACKEND_URL + "/static/images/cross.svg"} />
                                    </div>)}
                                </Draggable>
                            ))}
                            {provided.placeholder}
                            </div>)}
                                                        
                        </Droppable>
                    </DragDropContext>
                    

                </div>
                <div className="dataset-toolbar-resizeable" onMouseDown={resizeLeftToolbarHandleMouseDown}></div>
            </div>

            <div className="dataset-main" style={{width: "calc(100% - " + toolbarLeftWidth + "px)"}}>
                <div className="dataset-main-toolbar-outer" style={{height: toolbarMainHeight + "px"}}>
                    <div className="dataset-main-toolbar" style={{display: (toolbarMainHeight > 25 ? "flex" : "none")}}>
                        {model && <div className="dataset-title-container unselectable" title={(!showModelDescription ? "Show description" : "Hide description")} onClick={() => {setShowModelDescription(!showModelDescription)}}>
                           
                            <img className="dataset-title-icon" src={BACKEND_URL + "/static/images/model.svg"}/>
                            
                            <p className="dataset-title">{model && model.name}</p>

                            <img className="dataset-title-expand-icon" src={BACKEND_URL + "/static/images/" + (!showModelDescription ? "plus.png" : "minus.png")} />
                        </div>}

                        {model && <button type="button" title="Edit model" className="model-title-button" onClick={() => {
                            navigate("/edit-model/" + model.id + "?expanded=true")
                        }}>
                            <img className="model-title-edit-icon" src={BACKEND_URL + "/static/images/edit.png"}/>
                            Edit model
                        </button>}

                        {model && <button type="button" title="Build model" className="model-title-button" onClick={buildModel}>
                            <img className="model-download-icon" src={BACKEND_URL + "/static/images/build.svg"} />
                            Build model
                        </button>}

                        {model && <button type="button" title="Train model" className="model-title-button" onClick={() => {

                        }}>
                            <img className="model-download-icon" src={BACKEND_URL + "/static/images/lightbulb.svg"} />
                            Train model
                        </button>}

                        {model && <button className="model-download-button model-download-button" onClick={() => {
                            setShowDownloadPopup(true)
                        }} title="Download model"><img className="dataset-download-icon" src={BACKEND_URL + "/static/images/download.svg"}/>Download</button>}

                    </div>
                    
                    <div className="dataset-main-toolbar-resize" 
                        onMouseDown={resizeMainToolbarHandleMouseDown} 
                        style={{height: (toolbarMainHeight == 15 ? "15px" : "5px")}}
                        >
                        {toolbarMainHeight == 15 && <img className="toolbar-main-dropdown" src={BACKEND_URL + "/static/images/down.svg"} />}
                    </div>
                </div>

                <div className="dataset-main-display">
                    {showModelDescription && model &&<div className="dataset-description-display-container" ref={descriptionContainerRef}>
                        <div className="dataset-description-image-container" style={{width: "calc(100% - " + descriptionWidth + "%)"}}>
                            <img className="dataset-description-image" src={model.image} />
                        </div>

                        <div className="dataset-description-resize" onMouseDown={resizeDescriptionHandleMouseDown}></div>

                        <div className="dataset-description-display" style={{width: "calc(" + descriptionWidth + "%" + " - 5px)"}}>
                            <div className="dataset-description-header" title={model.name}>
                                {model.name}
                            </div>

                            <div className="model-description-stats">
                                {model.downloaders && <div className="model-description-stats-element">
                                    <img className="dataset-description-stats-icon" src={BACKEND_URL + "/static/images/download.svg"}/>
                                    {model.downloaders.length + (model.downloaders.length == 1 ? " download" : " downloads")}
                                </div>}

                                {layers && <div className="model-description-stats-element">
                                    <img className="dataset-description-stats-icon" src={BACKEND_URL + "/static/images/classification.png"}/>
                                    {layers.length + (layers.length == 1 ? " layer" : " layers")}
                                </div>}
                            </div>

                            {model.trained_on && model.trained_on.length > 0 && <div className="model-description-trained">
                                <p className="dataset-description-text trained-on-text dataset-description-start">Trained on:</p>
                                <div className="trained-on-container">
                                    {model.trained_on.map((id, idx) => (
                                        <div key={idx} className="trained-on-element" onClick={() => {
                                            const URL = window.location.origin + "/datasets/" + id
                                            var win = window.open(URL, '_blank');
                                            win.focus();
                                        }}>
                                            {model.trained_on_names[idx]}
                                            <img className="trained-on-icon" src={BACKEND_URL + "/static/images/external.png"} />
                                        </div>
                                    ))}
                                </div>
                            </div>}

                            <p className="dataset-description-text"><span className="dataset-description-start">Owner: </span>{model.ownername}</p>

                            {(model.description ? <p className="dataset-description-text dataset-description-description dataset-description-text-margin">{model.description}</p> : "This dataset does not have a description.")}

                            <button className="hide-description-button" onClick={() => {setShowModelDescription(false)}}>Hide description</button>
                        </div>

                    </div>}

                    {!showModelDescription && <div className="model-layers-container">
                        {layers.map((layer, idx) => (<div key={idx} className="layer-element-outer">
                            <LayerElement BACKEND_URL={BACKEND_URL} 
                                        layer={layer} 
                                        hoveredLayer={hoveredLayer} 
                                        deleteLayer={deleteLayer}
                                        updateModel={updateModel}></LayerElement>
                            {idx != layers.length - 1 && <div className="layer-element-connection"></div>}
                        </div>))}
                    </div>}
                </div>
            </div>
        </div>
    )

    
}

export default Model