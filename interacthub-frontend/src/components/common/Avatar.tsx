interface AvatarProps {
  src?: string;
  name: string;
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
}

const Avatar = ({ src, name, size = 'md', onClick }: AvatarProps) => {
  const sizes = { sm: 'w-8 h-8 text-sm', md: 'w-10 h-10 text-base', lg: 'w-16 h-16 text-xl' };
  const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  return src ? (
    <img src={src} alt={name} onClick={onClick}
      className={`${sizes[size]} rounded-full object-cover ${onClick ? 'cursor-pointer' : ''}`} />
  ) : (
    <div onClick={onClick}
      className={`${sizes[size]} rounded-full bg-linkedin-blue text-white flex items-center justify-center font-semibold ${onClick ? 'cursor-pointer' : ''}`}>
      {initials}
    </div>
  );
};
export default Avatar;