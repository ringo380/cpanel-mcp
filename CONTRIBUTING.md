# Contributing to cPanel MCP Server

Thank you for your interest in contributing to the cPanel MCP Server! This document provides guidelines and information for contributors.

## 🚀 Quick Start

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/cpanel-mcp.git
   cd cpanel-mcp
   ```
3. **Install dependencies**:
   ```bash
   npm install
   ```
4. **Set up environment**:
   ```bash
   cp .env.example .env
   # Edit .env with your test cPanel credentials
   ```
5. **Create a feature branch**:
   ```bash
   git checkout -b feature/your-feature-name
   ```

## 🛠️ Development Setup

### Prerequisites

- Node.js 18.0.0 or higher
- npm or yarn package manager
- A cPanel account for testing (recommended: use a development/staging account)
- Git

### Environment Configuration

Create a `.env` file with your test cPanel credentials:

```env
CPANEL_HOSTNAME=your-test-cpanel-hostname.com
CPANEL_USERNAME=your-test-username
CPANEL_API_TOKEN=your-test-api-token
CPANEL_PORT=2083
CPANEL_SSL=true
```

**⚠️ Important**: Use a test/development cPanel account, never production credentials.

### Development Commands

```bash
# Start development with watch mode
npm run dev

# Build the project
npm run build

# Run type checking
npm run typecheck

# Run linting
npm run lint

# Fix linting issues automatically
npm run lint -- --fix

# Run tests
npm test

# Run tests in watch mode
npm run test:watch
```

## 📝 Coding Standards

### TypeScript Guidelines

- Use TypeScript for all new code
- Maintain strict type checking
- Export interfaces and types from appropriate modules
- Use meaningful variable and function names
- Add JSDoc comments for public APIs

### Code Style

- Follow the existing ESLint configuration
- Use 2 spaces for indentation
- Use single quotes for strings
- Add trailing commas in multi-line structures
- Keep lines under 100 characters when possible

### Example Code Style

```typescript
export interface ExampleInterface {
  id: string;
  name: string;
  optional?: boolean;
}

export class ExampleClass {
  private readonly config: ExampleInterface;

  constructor(config: ExampleInterface) {
    this.config = config;
  }

  async performOperation(param: string): Promise<string> {
    try {
      const result = await this.someAsyncOperation(param);
      return result;
    } catch (error) {
      throw new Error(`Operation failed: ${error.message}`);
    }
  }
}
```

## 🧪 Testing

### Writing Tests

- Write tests for all new functionality
- Use Jest for testing framework
- Place tests in `__tests__` directories or use `.test.ts` suffix
- Mock external dependencies (cPanel API calls)
- Aim for high test coverage

### Test Structure

```typescript
describe('ComponentName', () => {
  beforeEach(() => {
    // Setup
  });

  afterEach(() => {
    // Cleanup
  });

  it('should perform expected behavior', async () => {
    // Arrange
    const input = 'test-input';

    // Act
    const result = await functionUnderTest(input);

    // Assert
    expect(result).toBe('expected-output');
  });
});
```

### Running Tests

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- cpanel-client.test.ts

# Run tests in watch mode
npm run test:watch
```

## 🔧 Adding New Features

### 1. cPanel Tool Implementation

When adding a new cPanel operation:

1. **Add the tool definition** in `src/tools.ts`:
   ```typescript
   {
     name: 'new_operation',
     description: 'Description of what this tool does',
     inputSchema: {
       type: 'object',
       properties: {
         param1: {
           type: 'string',
           description: 'Parameter description'
         }
       },
       required: ['param1']
     }
   }
   ```

2. **Implement the method** in `src/cpanel-client.ts`:
   ```typescript
   async newOperation(param1: string): Promise<any> {
     return this.executeUAPI('ModuleName', 'function_name', { param1 });
   }
   ```

3. **Add the handler** in `src/index.ts`:
   ```typescript
   case 'new_operation':
     if (!args?.param1) throw new Error('Parameter is required');
     result = await this.cpanelClient.newOperation(args.param1);
     break;
   ```

4. **Add type definitions** in `src/types/cpanel.ts` if needed

5. **Write tests** for the new functionality

6. **Update documentation** in README.md

### 2. Documentation Updates

- Update README.md with new tool information
- Add examples of usage
- Update API reference section
- Include any new environment variables or configuration

## 📋 Pull Request Guidelines

### Before Submitting

- [ ] Code follows the style guidelines
- [ ] Tests pass locally (`npm test`)
- [ ] Type checking passes (`npm run typecheck`)
- [ ] Linting passes (`npm run lint`)
- [ ] Documentation is updated
- [ ] Commit messages follow conventional commits

### Pull Request Process

1. **Create a descriptive title**:
   - `feat: add email forwarding management`
   - `fix: handle connection timeout errors`
   - `docs: update installation instructions`

2. **Write a clear description**:
   ```markdown
   ## Description
   Brief description of changes

   ## Changes Made
   - Added new feature X
   - Fixed bug Y
   - Updated documentation Z

   ## Testing
   - [ ] Tests added/updated
   - [ ] Manual testing performed
   - [ ] Documentation updated

   ## Breaking Changes
   None / List any breaking changes
   ```

3. **Link related issues**: Use `Fixes #123` or `Closes #123`

### Review Process

- All PRs require at least one review
- Address feedback promptly
- Keep discussions respectful and constructive
- Update your branch with main if requested

## 🚦 Commit Guidelines

### Conventional Commits

Use the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

### Types

- **feat**: New feature
- **fix**: Bug fix
- **docs**: Documentation changes
- **style**: Code style changes (formatting, etc.)
- **refactor**: Code refactoring
- **test**: Adding or updating tests
- **chore**: Maintenance tasks

### Examples

```bash
feat: add email quota management tool
fix: handle invalid hostname errors gracefully
docs: update cPanel API token generation steps
test: add tests for database operations
chore: update dependencies to latest versions
```

## 🐛 Bug Reports

### Before Reporting

1. Check existing issues
2. Verify it's not a configuration issue
3. Test with the latest version

### Bug Report Template

```markdown
**Describe the bug**
A clear description of the bug

**To Reproduce**
Steps to reproduce the behavior:
1. Set up environment with...
2. Run command...
3. See error

**Expected behavior**
What you expected to happen

**Environment:**
- OS: [e.g. Windows 10, macOS 12.0, Ubuntu 20.04]
- Node.js version: [e.g. 18.17.0]
- cPanel MCP version: [e.g. 1.0.0]
- cPanel version: [if known]

**Additional context**
Any other context about the problem
```

## 💡 Feature Requests

### Feature Request Template

```markdown
**Is your feature request related to a problem?**
A clear description of the problem

**Describe the solution you'd like**
A clear description of what you want to happen

**Describe alternatives you've considered**
Alternative solutions or features you've considered

**Additional context**
Any other context about the feature request
```

## 📚 Resources

### Useful Links

- [cPanel UAPI Documentation](https://documentation.cpanel.net/display/DD/Guide+to+UAPI)
- [Model Context Protocol Specification](https://modelcontextprotocol.io/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Jest Testing Framework](https://jestjs.io/docs/getting-started)

### Getting Help

- 💬 **Discussions**: [GitHub Discussions](https://github.com/ringo380/cpanel-mcp/discussions)
- 🐛 **Issues**: [GitHub Issues](https://github.com/ringo380/cpanel-mcp/issues)
- 📖 **Documentation**: Project README and Wiki

## 🎉 Recognition

Contributors will be recognized in the project README and release notes. Thank you for helping make this project better!

---

**Questions?** Feel free to ask in [GitHub Discussions](https://github.com/ringo380/cpanel-mcp/discussions) or open an issue.