import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Stack, TextInput, PasswordInput, Button, Title,
  Text, Alert, Center, Paper,
} from '@mantine/core';
import { authClient } from '../../lib/authClient';
import { useAuthStore } from '../../store/auth';

export function RegisterPage() {
  const navigate = useNavigate();
  const checkSession = useAuthStore(s => s.checkSession);
  const [name, setName]         = useState('');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState<string | null>(null);
  const [loading, setLoading]   = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await authClient.signUp.email({ name, email, password });
      await checkSession();
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Center h="100vh">
      <Paper p="xl" w={360} withBorder>
        <Stack>
          <Title order={2}>Create account</Title>

          {error && <Alert color="red">{error}</Alert>}

          <form onSubmit={handleSubmit}>
            <Stack>
              <TextInput
                label="Name" required
                value={name} onChange={e => setName(e.target.value)}
              />
              <TextInput
                label="Email" type="email" required
                value={email} onChange={e => setEmail(e.target.value)}
              />
              <PasswordInput
                label="Password" required minLength={8}
                value={password} onChange={e => setPassword(e.target.value)}
              />
              <Button type="submit" loading={loading}>Create account</Button>
            </Stack>
          </form>

          <Text size="sm" ta="center">
            Already have an account? <Link to="/login">Sign in</Link>
          </Text>
        </Stack>
      </Paper>
    </Center>
  );
}
