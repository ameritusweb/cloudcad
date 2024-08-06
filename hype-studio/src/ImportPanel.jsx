// src/components/ImportPanel.jsx
import React, { useState, useEffect } from 'react';
import { AiOutlinePlus } from 'react-icons/ai';
import DxfParser from 'dxf-parser';

const ImportPanel = () => {
  const [files, setFiles] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchImportedFiles();
  }, []);

  const fetchImportedFiles = async () => {
    try {
      const response = await fetch('/api/imported-files');
      if (response.ok) {
        const data = await response.json();
        setFiles(data.map(file => ({
          ...file,
          content: file.type === 'application/dxf' ? convertDxfToSvg(file.content) : file.content
        })));
      } else {
        setError('Failed to fetch imported files');
      }
    } catch (error) {
      setError('An error occurred while fetching imported files');
    }
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file && (file.type === 'image/svg+xml' || file.name.endsWith('.dxf'))) {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const fileContent = e.target.result;
        let newFile = {
          name: file.name,
          type: file.name.endsWith('.dxf') ? 'application/dxf' : 'image/svg+xml',
          content: fileContent,
        };

        try {
          const response = await fetch('/api/upload-file', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(newFile),
          });

          if (response.ok) {
            const uploadedFile = await response.json();
            if (uploadedFile.type === 'application/dxf') {
              uploadedFile.content = convertDxfToSvg(uploadedFile.content);
            }
            setFiles((prevFiles) => [...prevFiles, uploadedFile]);
          } else {
            setError('Failed to upload file');
          }
        } catch (error) {
          setError('An error occurred while uploading the file');
        }
      };
      reader.readAsText(file);
    } else {
      alert('Please upload a valid SVG or DXF file.');
    }
  };

  const handleNameChange = (id, newName) => {
    setFiles((prevFiles) =>
      prevFiles.map((file) =>
        file.id === id ? { ...file, name: newName } : file
      )
    );
  };

  const convertDxfToSvg = (dxfContent) => {
      try {

        const parser = new DxfParser();
    const dxf = parser.parseSync(dxfContent);

      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      let svgElements = [];

      dxf.entities.forEach(entity => {
        switch (entity.type) {
          case 'LINE':
            const [x1, y1, x2, y2] = [entity.vertices[0].x, -entity.vertices[0].y, entity.vertices[1].x, -entity.vertices[1].y];
            svgElements.push(`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="black" />`);
            minX = Math.min(minX, x1, x2);
            minY = Math.min(minY, y1, y2);
            maxX = Math.max(maxX, x1, x2);
            maxY = Math.max(maxY, y1, y2);
            break;
          case 'CIRCLE':
            const [cx, cy, r] = [entity.center.x, -entity.center.y, entity.radius];
            svgElements.push(`<circle cx="${cx}" cy="${cy}" r="${r}" stroke="black" fill="none" />`);
            minX = Math.min(minX, cx - r);
            minY = Math.min(minY, cy - r);
            maxX = Math.max(maxX, cx + r);
            maxY = Math.max(maxY, cy + r);
            break;
          case 'ARC':
            const [arcCx, arcCy, arcR, startAngle, endAngle] = [
              entity.center.x, -entity.center.y, entity.radius,
              entity.startAngle, entity.endAngle
            ];
            const [startX, startY] = [
              arcCx + arcR * Math.cos(startAngle),
              arcCy + arcR * Math.sin(startAngle)
            ];
            const [endX, endY] = [
              arcCx + arcR * Math.cos(endAngle),
              arcCy + arcR * Math.sin(endAngle)
            ];
            const largeArcFlag = endAngle - startAngle <= Math.PI ? "0" : "1";
            svgElements.push(`<path d="M ${startX} ${startY} A ${arcR} ${arcR} 0 ${largeArcFlag} 0 ${endX} ${endY}" stroke="black" fill="none" />`);
            minX = Math.min(minX, arcCx - arcR);
            minY = Math.min(minY, arcCy - arcR);
            maxX = Math.max(maxX, arcCx + arcR);
            maxY = Math.max(maxY, arcCy + arcR);
            break;
          case 'POLYLINE':
          case 'LWPOLYLINE':
            const points = entity.vertices.map(v => `${v.x},${-v.y}`).join(' ');
            svgElements.push(`<polyline points="${points}" stroke="black" fill="none" />`);
            entity.vertices.forEach(v => {
              minX = Math.min(minX, v.x);
              minY = Math.min(minY, -v.y);
              maxX = Math.max(maxX, v.x);
              maxY = Math.max(maxY, -v.y);
            });
            break;
          default:
            console.warn(`Unsupported entity type: ${entity.type}`);
        }
      });

      const width = maxX - minX;
      const height = maxY - minY;
      const viewBox = `${minX} ${minY} ${width} ${height}`;

      return `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}">
          ${svgElements.join('\n')}
        </svg>
      `;
    } catch (error) {
      console.error('Failed to convert DXF to SVG:', error);
      return '<svg xmlns="http://www.w3.org/2000/svg"><text x="10" y="20" fill="red">Error converting DXF</text></svg>';
    }
  };

  return (
    <div className="bg-black w-64 border-r border-gray-300">
      <div className="flex items-center justify-between p-2 border-b border-gray-300 text-white">
        <span>Import</span>
        <label>
          <AiOutlinePlus size={24} />
          <input type="file" accept=".svg,.dxf" onChange={handleFileChange} style={{ display: 'none' }} />
        </label>
      </div>
      {files.length > 0 ? (
        files.map((file) => (
          <div key={file.id} className="p-2 text-white border-b border-gray-300">
            <div className="mb-2">
              <input
                type="text"
                value={file.name}
                onChange={(e) => handleNameChange(file.id, e.target.value)}
                className="w-full p-1 bg-black text-white"
              />
            </div>
            <div className="bg-white">
              <div dangerouslySetInnerHTML={{ __html: file.content }} />
            </div>
          </div>
        ))
      ) : (
        <div className="p-2 text-white">No files imported.</div>
      )}
      {error && <div className="text-red-500">{error}</div>}
    </div>
  );
};

export default ImportPanel;