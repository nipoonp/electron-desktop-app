const demos = {
    soundcloud:
        '<iframe width="100%" height="166" scrolling="no" frameborder="no" allow="autoplay" src="https://w.soundcloud.com/player/?url=https%3A//api.soundcloud.com/tracks/379775672&color=%23ff5500&auto_play=true&hide_related=false&show_comments=true&show_user=true&show_reposts=false&show_teaser=true"></iframe>',
    plotly: '<iframe src="https://codesandbox.io/embed/q7jmjyplvq?fontsize=14" title="Plotly All Graph Types" allow="geolocation; microphone; camera; midi; vr; accelerometer; gyroscope; payment; ambient-light-sensor; encrypted-media" style="width:100%; height:500px; border:0; border-radius: 4px; overflow:hidden;" sandbox="allow-modals allow-forms allow-popups allow-scripts allow-same-origin"></iframe>',
    tabin: '<iframe width="100%" height="1000px" frameborder="no" src="https://restaurants.tabin.co.nz"></iframe>',
};

const Iframe = (props) => {
    return <div dangerouslySetInnerHTML={{ __html: props.iframe ? props.iframe : "" }} />;
};

export default () => {
    return (
        <div style={{ width: "100vw", height: "100vh" }}>
            <Iframe iframe={demos.tabin} allow="autoplay" />,
        </div>
    );
};
