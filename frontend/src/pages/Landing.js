import React, { useState } from "react"
import { useNavigate } from "react-router-dom";

// The default page. Login not required.
function Landing() {
    const navigate = useNavigate()
    const [transform, setTransform] = useState("");

    const handleMouseMove = (e) => {
        const { width, height, left, top } = e.target.getBoundingClientRect();
        const x = e.clientX - left; // Mouse position within the element
        const y = e.clientY - top;

        const rotateX = ((y / height) - 0.5) * -3; // Rotate up/down
        const rotateY = ((x / width) - 0.5) * 3;  // Rotate left/right

        setTransform(`perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`);
    };

    const handleMouseLeave = () => {
        setTransform(""); // Reset the transform when the mouse leaves
    };

    return (
        <div className="landing-container">
            <div className="landing-header">
                <div className="landing-header-col landing-header-left">
                    <h1 className="landing-title"><img className="landing-logo" src={window.location.origin + "/static/images/logoWhite.svg"}/>Dalinar.ai</h1>
                    <p className="landing-description"><span className="landing-pitch">Data labeling made easy.</span> 
                    Dalinar allows users to <span className="landing-description-highlighted">create and discover</span> 
                    both classification and area <span className="landing-description-highlighted no-margin">datasets</span>, while being easy to use and providing clear instructions 
                    how datasets can be loaded into code.
                    </p>

                    <div className="landing-header-buttons">
                        <button type="button" className="landing-header-button landing-header-signup" onClick={() => {
                            window.location.href = window.location.origin + "/accounts/signup/"
                        }}>Get started</button>
                        <button type="button" className="landing-header-button landing-header-explore" onClick={() => navigate("/explore")}>Explore datasets</button>
                    </div>
                </div>

                <div className="landing-header-col landing-header-right">
                    <div className="landing-header-image-container"
                    style={{
                        display: "inline-block",
                        perspective: "1000px",
                    }}
                    >
                    <img
                        src={window.location.origin + "/static/images/examplePage.jpg"}
                        className="landing-header-image"
                        alt="Example page"
                        style={{
                        width: "100%",
                        height: "100%",
                        transform,
                        transition: "transform 0.1s ease",
                        }}
                        onMouseMove={handleMouseMove}
                        onMouseLeave={handleMouseLeave}
                    />
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Landing