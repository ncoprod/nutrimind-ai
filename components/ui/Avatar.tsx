import React from 'react';

export const Avatar: React.FC<{ name?: string; className?: string }> = ({ name, className }) => {
    const initials = (name || 'User')
        .split(' ')
        .map(n => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase();

    return (
        <div className={`flex items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent text-primary-foreground ${className}`}>
            <span className="font-semibold">{initials}</span>
        </div>
    );
};
