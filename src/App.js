import logo from './logo.svg';
import './App.css';
import React, {useState} from 'react';
import { ZipReader, BlobReader, TextWriter } from '@zip.js/zip.js';
import { SignedXml } from 'xadesjs';
import { Parse } from 'xml-core';


function verifySignature(xml) {
  var signedDocument = Parse(xml, "application/xml");
  var xmlSignature = signedDocument.getElementsByTagNameNS("http://www.w3.org/2000/09/xmldsig#", "Signature");

  var signedXml = new SignedXml(signedDocument);
  signedXml.LoadXml(xmlSignature[0]);
  return signedXml.Verify()
}

function App() {
  const [selectedFiles, setSelectedFiles] = useState([]);

  return (
    <div className="App">
      <input type="file" onChange={(event) => {
        Array.from(event.target.files).map((f) => {
          const zf = new ZipReader(new BlobReader(f));
          zf.getEntries().then((entries) => {
            entries.forEach((entry) => {
              if (entry.filename == "META-INF/edoc-signatures-S1.xml") {
                entry.getData(new TextWriter()).then((xml) => {
                  verifySignature(xml).then((res) => {
                    console.log(res);
                  })
                })
              }
            })
          })
          return f;
        })
      }} />
    </div>
  );
}

export default App;
