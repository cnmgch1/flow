# Flow - Open Source ePub Reader

## Project Overview

Flow is an open-source, browser-based ePub reader that redefines the reading experience with advanced features. It's a monorepo project built primarily with React, Next.js, and TypeScript, designed to be free and accessible to everyone.

### Key Features
- Grid layout for book display
- In-book search functionality
- Image preview capabilities
- Customizable typography
- Highlighting and annotation tools
- Theme switching
- Share/download books via links
- Data export functionality
- WebDAV cloud storage integration (Dropbox removed)

### Technology Stack
- **Framework**: Next.js (v12.x)
- **Language**: TypeScript
- **UI Library**: React (v18)
- **Styling**: Tailwind CSS
- **State Management**: Recoil
- **Build System**: Turborepo
- **Package Manager**: pnpm
- **Core ePub Processing**: Custom fork of Epub.js
- **Deployment**: Docker containerization

### Architecture
The project follows a monorepo structure with multiple applications and shared packages:
- **Apps**:
  - `reader`: Main ePub reader application (port 7127 in dev)
  - `website`: Marketing/landing website (port 7117 in dev)
- **Packages**:
  - `epubjs`: Custom ePub processing library
  - `internal`: Shared internal utilities
  - `tailwind`: Shared Tailwind configuration

## Building and Running

### Prerequisites
- Node.js (>=18.0.0)
- pnpm
- Git

### Development Setup
1. Clone the repository:
   ```bash
   git clone https://github.com/pacexy/flow
   ```

2. Install dependencies:
   ```bash
   pnpm i
   ```

3. Set up environment variables:
   Copy all `.env.local.example` files to `.env.local` and configure values

4. Run the development server:
   ```bash
   pnpm dev
   ```

### Production Build
- Build the project: `pnpm build`
- Start production server: `pnpm start`

### Docker Deployment
- Using docker-compose: `docker compose up -d`
- Manual build and run:
  ```bash
  docker build -t flow .
  docker run -p 3000:3000 --env-file apps/reader/.env.local flow
  ```

## Development Conventions

### Code Quality
- ESLint for linting
- Prettier for code formatting
- Husky for pre-commit hooks
- lint-staged for selective linting

### Monorepo Management
- Turborepo for task orchestration
- pnpm workspaces for dependency management
- Shared packages for common functionality

### Testing
- Unit tests with Karma and Mocha (for epubjs package)
- Integration testing through the development workflow

### Styling
- Tailwind CSS for utility-first styling
- Consistent design tokens across applications
- Responsive design principles

## Contribution Guidelines

### Ways to Contribute
- Submit bug reports and feature requests
- Create pull requests for improvements
- Help validate issues reported by others
- Improve documentation

### Development Workflow
1. Fork and clone the repository
2. Create a feature branch
3. Make changes following the established code style
4. Test thoroughly
5. Submit a pull request with a clear description

## Project Structure
```
flow/
├── apps/
│   ├── reader/          # Main ePub reader application
│   └── website/         # Marketing website
├── packages/
│   ├── epubjs/          # ePub processing library
│   ├── internal/        # Shared utilities
│   └── tailwind/        # Shared Tailwind config
├── .github/             # GitHub templates and workflows
├── .husky/              # Git hooks
├── Dockerfile           # Container configuration
└── docker-compose.yml   # Docker orchestration
```

## Environment Variables
- Environment variables are managed through `.env.local` files in each app
- Example files are provided as `.env.local.example`
- Required variables include API keys, database connections, and service configurations

## Deployment
- The application can be deployed as a Docker container
- Self-hosting is supported with Docker and docker-compose
- Production builds are optimized for standalone deployment