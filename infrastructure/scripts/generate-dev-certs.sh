#!/bin/bash
# Script to generate development TLS certificates for the Marmitas application
# This creates self-signed certificates for local development

set -e

# Configuration
CERT_DIR="./certs"
KEY_FILE="$CERT_DIR/key.pem"
CERT_FILE="$CERT_DIR/cert.pem"
DAYS_VALID=365
COUNTRY="BR"
STATE="Sao Paulo"
LOCALITY="Sao Paulo"
ORGANIZATION="Marmitas Development"
COMMON_NAME="localhost"
DNS_ALT_NAMES="localhost,127.0.0.1,*.localhost"

# Create directory if it doesn't exist
mkdir -p "$CERT_DIR"

echo "Generating development TLS certificates..."
echo "Certificates will be valid for $DAYS_VALID days"

# Generate OpenSSL configuration for SAN support
cat > "$CERT_DIR/openssl.cnf" <<EOF
[req]
default_bits = 4096
prompt = no
default_md = sha256
distinguished_name = dn
x509_extensions = v3_req

[dn]
C = $COUNTRY
ST = $STATE
L = $LOCALITY
O = $ORGANIZATION
CN = $COMMON_NAME

[v3_req]
subjectAltName = @alt_names
basicConstraints = CA:FALSE
keyUsage = nonRepudiation, digitalSignature, keyEncipherment

[alt_names]
DNS.1 = localhost
DNS.2 = *.localhost
IP.1 = 127.0.0.1
EOF

# Generate private key and certificate
openssl req -x509 \
  -newkey rsa:4096 \
  -nodes \
  -sha256 \
  -keyout "$KEY_FILE" \
  -out "$CERT_FILE" \
  -days "$DAYS_VALID" \
  -config "$CERT_DIR/openssl.cnf" \
  -extensions v3_req

# Set proper permissions
chmod 600 "$KEY_FILE"
chmod 644 "$CERT_FILE"

echo "Certificate Info:"
openssl x509 -in "$CERT_FILE" -noout -text | grep -E "Issuer:|Subject:|Not|DNS:|IP Address:"

echo ""
echo "TLS certificates generated successfully!"
echo "Private Key: $KEY_FILE"
echo "Certificate: $CERT_FILE"
echo ""
echo "To trust this certificate in your browser, follow your browser's instructions for importing a CA."
echo "For Chrome on macOS: Settings -> Privacy and Security -> Security -> Manage Certificates"
echo "For Firefox: Preferences -> Privacy & Security -> View Certificates -> Import"

# Instructions for Node.js environment
echo ""
echo "To use these certificates with Node.js:"
echo "export NODE_EXTRA_CA_CERTS=$CERT_FILE"
echo "export HTTPS_KEY_FILE=$KEY_FILE"
echo "export HTTPS_CERT_FILE=$CERT_FILE" 