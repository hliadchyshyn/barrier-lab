import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Stack, TextInput, PasswordInput, Button, Title,
  Text, Divider, Alert, Center, Paper,
} from '@mantine/core';
import { IconBrandGoogle } from '@tabler/icons-react';
import { authClient } from '../../lib/authClient';
import { useAuthStore } from '../../store/auth';

export function LoginPage() {
  const navigate = useNavigate();
  const checkSession = useAuthStore(s => s.checkSession);
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState<string | null>(null);
  const [loading, setLoading]   = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await authClient.signIn.email({ email, password });
      await checkSession();
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = () => {
    authClient.signIn.social({ provider: 'google', callbackURL: '/' });
  };

  return (
    <Center h="100vh">
      <Paper p="xl" w={360} withBorder>
        <Stack>
          <Title order={2}>BarrierLab</Title>

          {error && <Alert color="red">{error}</Alert>}

          <form onSubmit={handleSubmit}>
            <Stack>
              <TextInput
                label="Email" type="email" required
                value={email} onChange={e => setEmail(e.target.value)}
              />
              <PasswordInput
                label="Password" required
                value={password} onChange={e => setPassword(e.target.value)}
              />
              <Button type="submit" loading={loading}>Sign in</Button>
            </Stack>
          </form>

          <Divider label="or" />

          <Button
            variant="default"
            leftSection={<IconBrandGoogle size={16} />}
            onClick={handleGoogle}
          >
            Continue with Google
          </Button>

          <Text size="sm" ta="center">
            No account? <Link to="/register">Register</Link>
          </Text>
        </Stack>
      </Paper>
    </Center>
  );
}
