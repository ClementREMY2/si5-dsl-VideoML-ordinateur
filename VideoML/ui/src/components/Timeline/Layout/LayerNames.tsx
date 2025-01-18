type TimelineLayoutLayerNamesProps = {
    layers: string[];
};

export const TimelineLayoutLayerNames: React.FC<TimelineLayoutLayerNamesProps> = ({ layers }) => {
    return (
        <div className="d-flex flex-column">
            {layers
                .sort(([layerA], [layerB]) => parseInt(layerB) - parseInt(layerA))
                .map((layer) => (
                    <div key={layer} className="text-nowrap d-flex flex-row align-items-center" style={{ height: 54 }}>Layer {layer}</div>
                ))}
        </div>
    )
};
