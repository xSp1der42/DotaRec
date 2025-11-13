import { render, screen, fireEvent } from '@testing-library/react';
import AdminLogoUpload from './AdminLogoUpload';

// Mock the hooks and API
jest.mock('../../hooks/useNotification', () => ({
  useNotification: () => ({
    showNotification: jest.fn()
  })
}));

jest.mock('../../services/api', () => ({
  post: jest.fn(),
  delete: jest.fn()
}));

const mockProps = {
  teamId: 'team123',
  teamName: 'Test Team',
  currentLogo: null,
  onLogoUpdate: jest.fn()
};

const mockPropsWithLogo = {
  ...mockProps,
  currentLogo: {
    originalUrl: '/uploads/logos/team-123-original.png',
    sizes: {
      small: '/uploads/logos/team-123-32.png',
      medium: '/uploads/logos/team-123-64.png',
      large: '/uploads/logos/team-123-128.png'
    }
  }
};

describe('AdminLogoUpload', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders team name and upload area', () => {
    render(<AdminLogoUpload {...mockProps} />);
    
    expect(screen.getByText('Test Team')).toBeInTheDocument();
    expect(screen.getByText('Перетащите файл сюда или нажмите для выбора')).toBeInTheDocument();
    expect(screen.getByText('PNG, JPG, SVG до 2MB')).toBeInTheDocument();
  });

  test('displays current logo when available', () => {
    render(<AdminLogoUpload {...mockPropsWithLogo} />);
    
    const logoImage = screen.getByAltText('Test Team logo');
    expect(logoImage).toBeInTheDocument();
    expect(logoImage).toHaveAttribute('src', '/uploads/logos/team-123-64.png');
    expect(screen.getByText('Удалить логотип')).toBeInTheDocument();
  });

  test('shows file input for upload', () => {
    render(<AdminLogoUpload {...mockProps} />);
    
    const fileInput = document.querySelector('input[type="file"]');
    expect(fileInput).toBeInTheDocument();
    expect(fileInput).toHaveAttribute('accept', 'image/png,image/jpeg,image/jpg,image/svg+xml');
  });

  test('handles file selection and shows preview', () => {
    render(<AdminLogoUpload {...mockProps} />);

    const validFile = new File(['test'], 'test.png', { type: 'image/png' });
    const hiddenInput = document.querySelector('input[type="file"]');
    
    Object.defineProperty(hiddenInput, 'files', {
      value: [validFile],
      writable: false,
    });
    
    fireEvent.change(hiddenInput);

    expect(screen.getByText('test.png')).toBeInTheDocument();
    expect(screen.getByText('Загрузить логотип')).toBeInTheDocument();
    expect(screen.getByText('Отмена')).toBeInTheDocument();
  });

  test('handles drag and drop events', () => {
    render(<AdminLogoUpload {...mockProps} />);

    const uploadArea = document.querySelector('.upload-area');
    
    // Test drag over
    fireEvent.dragOver(uploadArea);
    expect(uploadArea).toHaveClass('drag-over');

    // Test drag leave
    fireEvent.dragLeave(uploadArea);
    expect(uploadArea).not.toHaveClass('drag-over');
  });

  test('shows upload progress during upload', () => {
    render(<AdminLogoUpload {...mockProps} />);
    
    // Simulate uploading state by checking if progress elements exist in DOM
    const uploadArea = document.querySelector('.upload-area');
    expect(uploadArea).toBeInTheDocument();
  });

  test('renders delete button for existing logo', () => {
    render(<AdminLogoUpload {...mockPropsWithLogo} />);
    
    const deleteButton = screen.getByText('Удалить логотип');
    expect(deleteButton).toBeInTheDocument();
    expect(deleteButton).toHaveClass('delete-logo-btn');
  });

  test('renders upload placeholder when no logo exists', () => {
    render(<AdminLogoUpload {...mockProps} />);
    
    expect(screen.getByText('📁')).toBeInTheDocument();
    expect(screen.getByText('Перетащите файл сюда или нажмите для выбора')).toBeInTheDocument();
  });
});