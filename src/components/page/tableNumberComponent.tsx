import React, { useEffect, useRef } from "react";
import { Circle, Group, Layer, Line, Rect, Text, Transformer } from "react-konva";
import Konva from "konva";

import { FLOOR_STYLE_META, GRID_SIZE, STATUS_META, snapToGrid } from "../../util/tableNumberUtils";
import { ITableNodesAttributes } from "../../model/model";

export const TableNode = React.memo(
    ({
        shapeProps,
        isSelected,
        onSelect,
        onChange,
        isDesignMode,
    }: {
        shapeProps: ITableNodesAttributes;
        isSelected: boolean;
        onSelect: () => void;
        onChange: (newAttrs: ITableNodesAttributes) => void;
        isDesignMode: boolean;
    }) => {
        const shapeRef = useRef<Konva.Group>(null);
        const trRef = useRef<Konva.Transformer>(null);

        const isTableShape = ["rect", "circle"].includes(shapeProps.type);
        const isChairShape = ["chair", "stool", "armchair"].includes(shapeProps.type);
        const isLocked = !!shapeProps.locked;

        useEffect(() => {
            // Transformer is only attached for the currently selected editable node.
            if (isSelected && isDesignMode && !isLocked && trRef.current && shapeRef.current) {
                trRef.current.nodes([shapeRef.current]);
                trRef.current.getLayer()?.batchDraw();
            }
        }, [isSelected, isDesignMode, isLocked]);
        const status = shapeProps.status || "available";
        const statusMeta = STATUS_META[status];
        const handleSelect = () => {
            onSelect();
            // Chairs rotate in-place on tap to speed up layout editing without opening a side panel control.
            if (isDesignMode && isChairShape && !isLocked) {
                const currentRotation = shapeProps.rotation || 0;
                const nextRotation = (currentRotation + 270) % 360;
                onChange({
                    ...shapeProps,
                    rotation: nextRotation,
                });
            }
        };

        // Main Shape Rendering
        const renderShape = () => {
            const strokeColor = isSelected ? "#2f9e44" : statusMeta.stroke;
            const strokeWidth = isSelected ? 2 : 1;
            const shadow = {
                shadowColor: "black",
                shadowBlur: isSelected ? 10 : 2,
                shadowOpacity: 0.1,
                shadowOffset: { x: 1, y: 1 },
            };

            switch (shapeProps.type) {
                case "rect":
                    return (
                        <Rect
                            width={shapeProps.width}
                            height={shapeProps.height}
                            fill={statusMeta.fill}
                            stroke={strokeColor}
                            strokeWidth={strokeWidth}
                            cornerRadius={4}
                            {...shadow}
                        />
                    );
                case "circle":
                    return (
                        <Circle
                            x={shapeProps.width / 2}
                            y={shapeProps.height / 2}
                            radius={Math.min(shapeProps.width, shapeProps.height) / 2}
                            fill={statusMeta.fill}
                            stroke={strokeColor}
                            strokeWidth={strokeWidth}
                            {...shadow}
                        />
                    );
                case "wall":
                    return <Rect width={shapeProps.width} height={shapeProps.height} fill="#343a40" cornerRadius={2} />;
                case "pillar":
                    return <Rect width={shapeProps.width} height={shapeProps.height} fill="#868e96" cornerRadius={2} />;
                case "plant":
                    return (
                        <Circle
                            x={shapeProps.width / 2}
                            y={shapeProps.height / 2}
                            radius={Math.min(shapeProps.width, shapeProps.height) / 2}
                            fill="#20c997"
                            stroke="#0ca678"
                            strokeWidth={2}
                        />
                    );
                case "floor": {
                    const floorStyle = shapeProps.floorStyle || "wood";
                    const patternLines: React.ReactElement[] = [];

                    // Floor nodes render a lightweight pattern instead of images so scaling stays cheap in Konva.
                    if (floorStyle === "tile") {
                        for (let x = 0; x < shapeProps.width; x += GRID_SIZE) {
                            patternLines.push(<Line key={`tile-v-${x}`} points={[x, 0, x, shapeProps.height]} stroke="#dee2e6" strokeWidth={1} />);
                        }
                        for (let y = 0; y < shapeProps.height; y += GRID_SIZE) {
                            patternLines.push(<Line key={`tile-h-${y}`} points={[0, y, shapeProps.width, y]} stroke="#dee2e6" strokeWidth={1} />);
                        }
                    }

                    if (floorStyle === "wood") {
                        for (let y = 0; y < shapeProps.height; y += 14) {
                            patternLines.push(
                                <Line key={`wood-${y}`} points={[0, y, shapeProps.width, y]} stroke="#d6c5ae" strokeWidth={1} opacity={0.6} />,
                            );
                        }
                    }

                    if (floorStyle === "concrete") {
                        for (let x = 0; x < shapeProps.width; x += 24) {
                            patternLines.push(
                                <Line
                                    key={`concrete-${x}`}
                                    points={[x, 0, x + 6, shapeProps.height]}
                                    stroke="#ced4da"
                                    strokeWidth={1}
                                    opacity={0.3}
                                />,
                            );
                        }
                    }

                    return (
                        <Group>
                            <Rect
                                width={shapeProps.width}
                                height={shapeProps.height}
                                fill={FLOOR_STYLE_META[floorStyle].fill}
                                stroke={FLOOR_STYLE_META[floorStyle].stroke}
                                strokeWidth={1}
                                cornerRadius={2}
                            />
                            {patternLines}
                        </Group>
                    );
                }

                // New Chair Types
                case "chair":
                    return (
                        <Group>
                            {/* Backrest */}
                            <Rect x={0} y={0} width={shapeProps.width} height={8} fill="#d0bba2" cornerRadius={[4, 4, 0, 0]} />
                            {/* Seat */}
                            <Rect
                                x={0}
                                y={4}
                                width={shapeProps.width}
                                height={shapeProps.height - 4}
                                fill="#f0e6cc"
                                cornerRadius={4}
                                stroke="#d0bba2"
                                strokeWidth={1}
                            />
                        </Group>
                    );
                case "stool":
                    return (
                        <Circle
                            x={shapeProps.width / 2}
                            y={shapeProps.height / 2}
                            radius={Math.min(shapeProps.width, shapeProps.height) / 2}
                            fill="#d4a373"
                            stroke="#a98467"
                            strokeWidth={2}
                        />
                    );
                case "armchair":
                    return (
                        <Group>
                            {/* Arms */}
                            <Rect x={0} y={0} width={8} height={shapeProps.height} fill="#e9d8a6" cornerRadius={4} />
                            <Rect x={shapeProps.width - 8} y={0} width={8} height={shapeProps.height} fill="#e9d8a6" cornerRadius={4} />
                            {/* Back */}
                            <Rect x={8} y={0} width={shapeProps.width - 16} height={8} fill="#e9d8a6" cornerRadius={4} />
                            {/* Seat */}
                            <Rect x={8} y={8} width={shapeProps.width - 16} height={shapeProps.height - 8} fill="#faedcd" cornerRadius={2} />
                        </Group>
                    );
                default:
                    return null;
            }
        };

        return (
            <>
                <Group
                    onClick={handleSelect}
                    onTap={handleSelect}
                    onDblClick={() => {
                        // Only allow in view mode
                        if (!isDesignMode && isTableShape) {
                            onSelect(); // select the table first
                        }
                    }}
                    ref={shapeRef}
                    {...shapeProps}
                    draggable={isDesignMode && !isLocked}
                    onDragEnd={(e) => {
                        if (isLocked) return;
                        // Persist snapped coordinates instead of raw drag coordinates to avoid drift.
                        onChange({
                            ...shapeProps,
                            x: snapToGrid(e.target.x()),
                            y: snapToGrid(e.target.y()),
                        });
                    }}
                    onTransformEnd={() => {
                        if (isLocked) return;
                        const node = shapeRef.current;
                        if (!node) return;
                        const scaleX = node.scaleX();
                        const scaleY = node.scaleY();
                        // Konva stores transform scale separately; flatten it back into width/height before saving.
                        node.scaleX(1);
                        node.scaleY(1);
                        onChange({
                            ...shapeProps,
                            x: snapToGrid(node.x()),
                            y: snapToGrid(node.y()),
                            width: isDesignMode ? snapToGrid(Math.max(20, node.width() * scaleX)) : Math.max(20, node.width() * scaleX),
                            height: isDesignMode ? snapToGrid(Math.max(20, node.height() * scaleY)) : Math.max(20, node.height() * scaleY),
                            rotation: node.rotation(),
                        });
                    }}
                >
                    {renderShape()}

                    {/* Text Label (Only for tables) */}
                    {isTableShape && (
                        <Text
                            text={shapeProps.number}
                            width={shapeProps.width}
                            height={shapeProps.height}
                            align="center"
                            verticalAlign="middle"
                            fontSize={14}
                            fontFamily="'Inter', sans-serif"
                            fontStyle="bold"
                            fill={isSelected ? "#fff" : statusMeta.text}
                        />
                    )}
                    {isTableShape && !isDesignMode && (
                        <Circle
                            x={shapeProps.width - 10}
                            y={10}
                            radius={5}
                            fill={statusMeta.dot}
                            stroke={isSelected ? "#2f9e44" : "#fff"}
                            strokeWidth={1}
                        />
                    )}
                </Group>
                {isSelected && isDesignMode && !isLocked && (
                    <Transformer
                        ref={trRef}
                        boundBoxFunc={(oldBox, newBox) => (newBox.width < 20 || newBox.height < 20 ? oldBox : newBox)}
                        rotateEnabled={true}
                    />
                )}
            </>
        );
    },
);

export const BackgroundGrid = ({ width, height }: { width: number; height: number }) => {
    const lines: React.ReactElement[] = [];
    for (let i = 0; i < width / GRID_SIZE; i++)
        lines.push(<Line key={`v-${i}`} points={[i * GRID_SIZE, 0, i * GRID_SIZE, height]} stroke="#dee2e6" strokeWidth={1} dash={[4, 4]} />);
    for (let j = 0; j < height / GRID_SIZE; j++)
        lines.push(<Line key={`h-${j}`} points={[0, j * GRID_SIZE, width, j * GRID_SIZE]} stroke="#dee2e6" strokeWidth={1} dash={[4, 4]} />);
    return <Layer listening={false}>{lines}</Layer>;
};
