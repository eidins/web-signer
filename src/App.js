import logo from './logo.svg';
import './App.css';
import React, {useState} from 'react';
import { ZipReader, BlobReader, TextWriter } from '@zip.js/zip.js';
import * as XAdES from 'xadesjs';


function verify(file) {
  const zf = new ZipReader(new BlobReader(file));
  return zf.getEntries().then((entries) => {
    return entries.find(
      (entry) => entry.filename == "META-INF/edoc-signatures-S1.xml"
    ).getData(new TextWriter())
  }).then((signaturesXml) => {
    try {
      return XAdES.Parse(signaturesXml, "application/xml");
    } catch (e) {
      console.info("Failed to parse xml");
      throw e;
    }
  }).then((signedDocument) => {
    var xmlSignature = signedDocument.getElementsByTagNameNS("http://www.w3.org/2000/09/xmldsig#", "Signature");
    var signedXml = new XAdES.SignedXml(signedDocument);

    signedXml.LoadXml(xmlSignature[0]);
    console.log(signedXml);
    return signedXml.Verify()
  })
}

function sign(file) {
  var signedXml = new XAdES.SignedXml();
  var ts = new XAdES.xml.SignatureTimeStamp();
  ts.EncapsulatedTimeStamp.Add(new XAdES.xml.EncapsulatedTimeStamp())
  signedXml.Properties.UnsignedProperties.UnsignedSignatureProperties.Add(ts)
  console.log(signedXml.Properties.UnsignedProperties.UnsignedSignatureProperties);
}

function Verified(props) {
  if (props.value) {
    return <div>Verified!</div>
  } else {
    return <div></div>
  }
}

function App() {
  const [verified, setVerified] = useState(false);

  return (
    <div className="App">
      <input type="file" onChange={(event) => {
        Array.from(event.target.files).map((f) => {
          console.log(f);
          if (f.type == "application/vnd.etsi.asic-e+zip") {
            verify(f).then(setVerified);
          }

          return f;
        })
      }} />
      <Verified value={verified} />
    </div>
  );
}

export default App;
