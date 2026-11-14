// Adapted from the licensed Tailwind Plus Spotlight TypeScript template.
import { forwardRef } from 'react';
import clsx from 'clsx';

export const ContainerOuter = forwardRef<HTMLDivElement, React.ComponentPropsWithoutRef<'div'>>(
  function ContainerOuter({ className, children, ...props }, ref) {
    return <div ref={ref} className={clsx('sm:px-8', className)} {...props}>
      <div className="mx-auto w-full max-w-7xl lg:px-8">{children}</div>
    </div>;
  },
);

export const ContainerInner = forwardRef<HTMLDivElement, React.ComponentPropsWithoutRef<'div'>>(
  function ContainerInner({ className, children, ...props }, ref) {
    return <div ref={ref} className={clsx('relative px-6 sm:px-8 lg:px-12', className)} {...props}>
      <div className="mx-auto max-w-2xl lg:max-w-[1120px]">{children}</div>
    </div>;
  },
);

export const Container = forwardRef<HTMLDivElement, React.ComponentPropsWithoutRef<'div'>>(
  function Container({ children, ...props }, ref) {
    return <ContainerOuter ref={ref} {...props}><ContainerInner>{children}</ContainerInner></ContainerOuter>;
  },
);
