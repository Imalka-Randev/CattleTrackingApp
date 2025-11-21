import { StyleSheet } from 'react-native';

export default StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFDF6', // cream white
  },
  innerContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#7C4F29', // earth brown
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#333333', // charcoal gray
    marginBottom: 40,
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#7C4F29', // earth brown
    marginBottom: 8,
  },
  input: {
    height: 50,
    backgroundColor: '#F8F5EC', // very light beige
    borderColor: '#E0D7C6', // light beige border
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#333333', // charcoal gray text
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  eyeButton: {
    position: 'absolute',
    right: 16,
    padding: 10,
  },
  eyeButtonText: {
    color: '#228B22', // forest green
    fontWeight: '500',
  },
  registerButton: {
    backgroundColor: '#228B22', // forest green
    borderRadius: 10,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    shadowColor: '#7C4F29', // earth brown shadow
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  registerButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 30,
  },
  loginText: {
    color: '#333333', // charcoal gray
    fontSize: 14,
  },
  loginLink: {
    color: '#38BDF8', // sky blue (secondary)
    fontSize: 14,
    fontWeight: '600',
  },
});

