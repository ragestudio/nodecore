export default ({ indexJS }) => {
    // not exclude
    expect(indexJS).toContain(`var reactIntl = 'reactIntl';`);
    // exclude
    expect(indexJS).toContain(`const react = 'react';`);
    expect(indexJS).toContain(`const foo = 'foo';`);
};
