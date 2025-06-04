import { useState } from 'react';
import axios from 'axios';

function BulkUpload() {
  const [file, setFile] = useState(null);

  const handleUpload = async () => {
    if (!file) return alert('Please select a file first!');
    const reader = new FileReader();
    reader.onload = async (e) => {
      const arrayBuffer = e.target.result;
      const uint8Array = new Uint8Array(arrayBuffer);
      const binaryString = String.fromCharCode.apply(null, uint8Array);
      try {
        await axios.post('http://localhost:5000/api/students/bulk', {
          data: btoa(binaryString), // Convert to base64
          filename: file.name,
        }, {
          headers: { 'Content-Type': 'application/json' },
        });
        alert('Bulk upload successful');
      } catch (error) {
        alert('Upload failed: ' + error.message);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  return (
    <div className="container">
      <h2>Bulk Upload</h2>
      <input
        type="file"
        accept=".xlsx"
        onChange={(e) => setFile(e.target.files[0])}
      />
      <button onClick={handleUpload} disabled={!file}>Upload</button>
    </div>
  );
}

export default BulkUpload;