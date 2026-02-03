# NFC Storage Control

A modern storage and inventory management system that uses **NFC tags**, a **publicly accessible home server**, and a **cloud-hosted database** to bridge physical items with digital control.

## 📦 What is NFC Storage Control?

**NFC Storage Control** lets you manage physical items by attaching NFC tags to them and linking each tag to an entry in a database.

By scanning an NFC tag with a phone, you can instantly access:
- Item identity
- Storage location
- Notes and metadata
- Status or category information

The system is designed to be accessible **from anywhere**, not just a local network.

## 🏷️ NFC-Based Item Identification

- Each item has a unique NFC tag
- The tag ID is mapped to an item record in the database
- Scanning the tag opens the item data via the web interface
- No manual searching — scan and access instantly

## ☁️ Database Architecture

- Item data is stored in **AWS RDS**
- Ensures reliability, backups, and scalability
- Separates data storage from server logic for better security and flexibility

## 🖥️ Server Architecture

The system runs on a **self-made home server**, which hosts:

- **Backend:** Django (REST API)
- **Frontend:** React
- **Containerization:** Docker & Docker Compose

The server is **publicly accessible**, allowing item data to be viewed and managed from anywhere in the world.

## 🔐 Security Approach

Security is a core focus of this project.

The server setup includes:
- Multiple firewalls
- Reverse proxies
- Network filtering and access control
- Hardened Docker containers

Security practices are implemented based on dedicated cybersecurity training and best practices, with the goal of minimizing attack surface and preventing unauthorized access.

## ⚙️ Tech Stack

- NFC tags
- Django (Backend API)
- React (Frontend)
- AWS RDS (Database)
- Docker & Docker Compose
- Reverse proxy & firewall stack

## 📊 Why NFC Storage is Better Than Traditional Systems

**Instant access**
- No searching, scrolling, or typing
- Scan the item and get its data immediately

**Fewer human errors**
- No mislabeled boxes or forgotten contents
- Each item has a unique digital identity

**Scales easily**
- Works for small personal storage or large inventories
- Adding items only requires a new NFC tag

**Physical-to-digital link**
- The item itself becomes the key to its data
- No need to remember names or locations

**Automation-ready**
- Can be extended with actions, logs, or integrations
- NFC scans can trigger future workflows

## 🧠 Project Purpose

This project was built to explore:
- Real-world NFC applications
- Secure self-hosted infrastructure
- Cloud + home server hybrid systems
- Practical cybersecurity implementation

It combines software engineering, infrastructure, and security into a single real-world system.
