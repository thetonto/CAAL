import { sanitizeWorkflow } from '../workflow-sanitizer';

/**
 * Test workflow sanitizer with sample workflows
 */

// Sample "raw" workflow with hardcoded URL and credentials
const rawWorkflow = {
  name: 'test_workflow',
  meta: {
    instanceId: 'abc123-user-specific-id',
  },
  nodes: [
    {
      parameters: {
        httpMethod: 'POST',
        path: 'test_workflow',
        responseMode: 'responseNode',
      },
      id: 'webhook-trigger',
      name: 'Webhook',
      type: 'n8n-nodes-base.webhook',
      typeVersion: 2,
      position: [240, 400],
      notes: 'Test workflow for sanitization',
    },
    {
      parameters: {
        method: 'GET',
        url: 'http://192.168.1.100:5000/api/status',
        authentication: 'genericCredentialType',
        genericAuthType: 'httpHeaderAuth',
      },
      id: 'http-request',
      name: 'HTTP Request',
      type: 'n8n-nodes-base.httpRequest',
      typeVersion: 4.2,
      position: [460, 200],
      credentials: {
        httpHeaderAuth: {
          id: '123456',
          name: 'My API Key',
        },
      },
    },
  ],
};

// Test 1: Basic sanitization
console.log('Test 1: Basic workflow sanitization');
try {
  const result = sanitizeWorkflow(JSON.parse(JSON.stringify(rawWorkflow)));

  console.log('✓ Sanitization completed');
  console.log('  Detected credentials:', result.detected.credentials);
  console.log('  Detected variables:', result.detected.variables);
  console.log('  Warnings:', result.warnings);

  // Verify URL was replaced
  const sanitizedStr = JSON.stringify(result.sanitized);
  if (!sanitizedStr.includes('192.168.1.100')) {
    console.log('✓ URL replaced with variable');
  } else {
    console.error('✗ URL was not replaced!');
  }

  // Verify credential ID was nullified
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const httpNode = result.sanitized.nodes.find((n: any) => n.id === 'http-request');
  if (httpNode.credentials.httpHeaderAuth.id === null) {
    console.log('✓ Credential ID nullified');
  } else {
    console.error('✗ Credential ID was not nullified!');
  }

  // Verify instanceId was removed
  if (!result.sanitized.meta?.instanceId) {
    console.log('✓ Instance ID removed from meta');
  } else {
    console.error('✗ Instance ID still present!');
  }

  console.log('\n');
} catch (error) {
  console.error('✗ Test failed:', error);
}

// Test 2: Workflow with secrets (should throw)
console.log('Test 2: Workflow with secrets (should throw)');
const workflowWithSecrets = {
  ...rawWorkflow,
  nodes: [
    ...rawWorkflow.nodes,
    {
      parameters: {
        apiKey: 'sk-abc123def456ghi789jkl012mno345',
      },
      id: 'secret-node',
      name: 'Node with Secret',
      type: 'n8n-nodes-base.test',
    },
  ],
};

try {
  sanitizeWorkflow(workflowWithSecrets);
  console.error('✗ Should have thrown error for secrets!');
} catch (error) {
  if (error instanceof Error && error.message.includes('secrets detected')) {
    console.log('✓ Correctly blocked workflow with secrets');
    console.log(`  Error message: ${error.message}\n`);
  } else {
    console.error('✗ Wrong error thrown:', error);
  }
}

// Test 3: Workflow with resource locator
console.log('Test 3: Workflow with resource locator');
const workflowWithRL = {
  ...rawWorkflow,
  nodes: [
    ...rawWorkflow.nodes,
    {
      parameters: {
        calendar: {
          __rl: true,
          mode: 'list',
          value: 'calendar-id-123',
          cachedResultName: 'My Calendar',
        },
      },
      id: 'calendar-node',
      name: 'Calendar Node',
      type: 'n8n-nodes-base.googleCalendar',
    },
  ],
};

try {
  const result = sanitizeWorkflow(JSON.parse(JSON.stringify(workflowWithRL)));

  // Check if resource locator was converted
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const calendarNode = result.sanitized.nodes.find((n: any) => n.id === 'calendar-node');

  if (calendarNode.parameters.calendar.__rl && calendarNode.parameters.calendar.mode === 'id') {
    console.log('✓ Resource locator converted from list to id mode');
    console.log(`  Value: ${calendarNode.parameters.calendar.value}`);
  } else {
    console.error('✗ Resource locator was not converted!');
  }

  console.log('\n');
} catch (error) {
  console.error('✗ Test failed:', error);
}

console.log('All tests completed!');
